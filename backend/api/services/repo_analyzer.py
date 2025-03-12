import requests
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
import base64
import os
import shutil
import git
import subprocess
from github import Github
from gitingest import ingest
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import tempfile
from pathlib import Path
import json
from api.services.sonarAnalysis import SonarAnalyzer
import sys
from datetime import datetime
from dotenv import load_dotenv


@dataclass
class ErrorResponse:
    """Structured error response"""
    error: str
    details: Optional[str] = None
    timestamp: str = datetime.now().isoformat()

    def to_json(self) -> Dict:
        return {
            "status": "error",
            "error": self.error,
            "details": self.details,
            "timestamp": self.timestamp
        }

@dataclass
class AnalysisResult:
    """Structured output combining AI and SonarQube analysis"""
    # Project Info
    project_name: str
    project_path: str
    description: str
    technologies: List[str]
    
    # Code Quality
    metrics: Dict
    issues: List[Dict]
    security_hotspots: List[Dict]

    def to_json(self) -> Dict:
        return {
            "status": "success",
            "project_info": {
                "name": self.project_name,
                "path": str(self.project_path),
                "description": self.description,
                "technologies": self.technologies
            },
            "code_quality": {
                "metrics": self.metrics,
                "issues": self.issues,
                "security_hotspots": self.security_hotspots
            }
        }

@dataclass
class SonarError:
    """Structured error response for SonarQube analysis"""
    error: str
    details: Optional[str] = None
    timestamp: str = datetime.now().isoformat()

    def to_json(self) -> Dict:
        return {
            "status": "error",
            "error": self.error,
            "details": self.details,
            "timestamp": self.timestamp
        }

class RepoAnalyzer:
    def __init__(self, github_token: str, huggingface_token: str, sonar_token: str, sonar_host: str = "http://localhost:9000"):
        self.github_headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.hf_headers = {"Authorization": f"Bearer {huggingface_token}"}
        self.API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        self.sonar_analyzer = SonarAnalyzer(sonar_token, sonar_host)
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def analyze_repository(self, repo_url: str) -> Union[AnalysisResult, ErrorResponse]:
        """Analyze repository using both AI and SonarQube"""
        try:
            # Validate repository URL
            if not repo_url:
                return ErrorResponse(
                    error="Invalid Repository URL",
                    details="URL must be a valid git repository URL ending with .git"
                )

            with tempfile.TemporaryDirectory() as repo_dir:
                try:
                    project_name = repo_url.split('/')[-1].replace('.git', '')
                    self.repo_dir = f"./cloned/{project_name}"
                    logger.info(f"Cloning repository to: {Path(self.repo_dir).resolve()}")
                    
                    # Clone repository
                    clone_result = self._clone_repo(repo_url)
                    if isinstance(clone_result, ErrorResponse):
                        return clone_result
                    
                    # Get AI Analysis
                    _, tree, content = ingest(str(self.repo_dir))
                    ai_result = self._generate_ai_review(repo_url, tree, content)
                    if isinstance(ai_result, ErrorResponse):
                        return ai_result
                    
                    # Get SonarQube Analysis
                    project_key = repo_url.split('/')[-1].replace('.git', '').lower()
                    sonar_result = self.sonar_analyzer.analyze_repository(str(self.repo_dir), project_key)
                    
                    if not sonar_result:
                        logger.warning("SonarQube analysis failed, using empty metrics")
                        sonar_result = {
                            "metrics": {
                                "bugs": 0,
                                "vulnerabilities": 0,
                                "code_smells": 0,
                                "security_hotspots": 0
                            },
                            "issues": [],
                            "security_hotspots": []
                        }
                    
                    # Combine results
                    return AnalysisResult(
                        project_name=ai_result.get('name', 'Unknown Project'),
                        project_path=Path(self.repo_dir).resolve(),
                        description=ai_result.get('description', 'No description available'),
                        technologies=ai_result.get('technologies', []),
                        metrics=sonar_result['metrics'],
                        issues=sonar_result['issues'],
                        security_hotspots=sonar_result.get('security_hotspots', [])
                    )
                    
                except Exception as e:
                    logger.error(f"Error analyzing repository: {str(e)}")
                    return ErrorResponse(
                        error="Repository Analysis Failed",
                        details=str(e)
                    )
                
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return ErrorResponse(
                error="Unexpected Error",
                details=str(e)
            )

    def _clone_repo(self, repo_url: str) -> Union[bool, ErrorResponse]:
        """Clone repository to temporary directory"""
        try:
            subprocess.run([
                'git', 'clone',
                '--depth=2',
                '--no-checkout',
                '--config', 'core.fileMode=false',
                '--config', 'core.symlinks=false',
                repo_url,
                str(self.repo_dir)
            ], check=True, capture_output=True)
            
            repo = git.Repo(str(self.repo_dir))
            repo.git.checkout('HEAD')
            return True
            
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            return ErrorResponse(
                error="Git Clone Failed",
                details=error_msg
            )
        except Exception as e:
            return ErrorResponse(
                error="Repository Clone Failed",
                details=str(e)
            )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _generate_ai_review(self, repo_url: str, tree: str, content: str) -> Union[Dict, ErrorResponse]:
        """Generate project summary using Mistral"""
        try:
            logger.info(f"Sending request to Hugging Face API for repository: {repo_url}")
            
            response = requests.post(
                self.API_URL,
                headers=self.hf_headers,
                json={
                    "inputs": self._get_analysis_prompt(tree, content),
                    "parameters": {
                        "max_length": 2000,
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "return_full_text": False
                    }
                },
                timeout=30
            )
            
            response.raise_for_status()
            
            response_json = response.json()
            
            if not response_json or not isinstance(response_json, list) or len(response_json) == 0:
                return ErrorResponse(
                    error="Invalid API Response",
                    details="API response format was not as expected"
                )
                
            analysis = response_json[0].get('generated_text', '')
            if not analysis:
                return ErrorResponse(
                    error="Empty Analysis",
                    details="No analysis text generated by API"
                )
                
            logger.info("Successfully received analysis from API")
            return self._parse_ai_analysis(analysis)
            
        except requests.exceptions.RequestException as e:
            return ErrorResponse(
                error="API Request Failed",
                details=str(e)
            )
        except Exception as e:
            return ErrorResponse(
                error="AI Analysis Failed",
                details=str(e)
            )

    def _parse_ai_analysis(self, analysis: str) -> Union[Dict, ErrorResponse]:
        """Parse AI response into structured format"""
        try:
            clean_analysis = analysis.replace('\n---\n', '')
            json_analysis = json.loads(clean_analysis)
            return json_analysis
        except json.JSONDecodeError as e:
            return ErrorResponse(
                error="JSON Parse Error",
                details=f"Failed to parse AI response: {str(e)}"
            )
        except Exception as e:
            return ErrorResponse(
                error="Analysis Parse Error",
                details=str(e)
            )

    def _get_analysis_prompt(self, tree: str, content: str) -> str:
        """Get the analysis prompt template"""
        return f"""
You are a coding expert. Please provide a concise project overview of this codebase.

Context:
- Directory structure:
{tree}

- Source code:
{content}

Please provide a JSON format response with the following fields:

1. Project Name
2. Brief Description
3. Main Purpose and Functionality
4. Technologies Used

Provide with a JSON response in the following format:
  name: "SkillScout",
  description: "A comprehensive platform designed to bridge the gap between developers and employers through skill-based hiring. The project features an innovative assessment system that evaluates technical capabilities through real-world project analysis, automated code review, and interactive technical assessments. It integrates with GitHub to analyze coding patterns, project structures, and development practices, providing meaningful insights for both candidates and employers.",
  technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase", "TailwindCSS"]
"""

