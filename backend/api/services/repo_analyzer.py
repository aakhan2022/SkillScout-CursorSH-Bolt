import requests
from typing import Dict, List, Optional
from dataclasses import dataclass
import base64
import os
import shutil
import git
from github import Github
from gitingest import ingest
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import tempfile
from pathlib import Path
import json
from .sonarAnalysis import SonarAnalyzer

@dataclass
class AnalysisResult:
    """Structured output combining AI and SonarQube analysis"""
    # AI Analysis
    project_name: str
    description: str
    technologies: List[str]
    
    # SonarQube Analysis
    metrics: Dict
    issues: List[Dict]
    security_hotspots: List[Dict]

    def to_json(self) -> Dict:
        """Convert analysis result to JSON format"""
        return {
            "project_info": {
                "name": self.project_name,
                "description": self.description,
                "technologies": self.technologies
            },
            "code_quality": {
                "metrics": self.metrics,
                "issues": self.issues,
                "security_hotspots": self.security_hotspots
            }
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
    def analyze_repository(self, repo_url: str) -> AnalysisResult:
        """Analyze repository using both AI and SonarQube"""
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                self.repo_dir = Path(temp_dir)
                self._clone_repo(repo_url)
                
                # Get AI Analysis
                _, tree, content = ingest(str(self.repo_dir))
                ai_result = self._generate_ai_review(repo_url, tree, content)
                
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
                    description=ai_result.get('description', 'No description available'),
                    technologies=ai_result.get('technologies', []),
                    metrics=sonar_result['metrics'],
                    issues=sonar_result['issues'],
                    security_hotspots=sonar_result.get('security_hotspots', [])
                )
                
            except Exception as e:
                logger.error(f"Error analyzing repository: {str(e)}")
                return self._generate_basic_review()

    def _clone_repo(self, repo_url: str) -> None:
        """Clone repository to temporary directory"""
        try:
            # Use git command directly with correct options
            import subprocess
            subprocess.run([
                'git', 'clone',
                '--depth=1',
                '--no-checkout',   # Don't checkout files yet
                '--config', 'core.fileMode=false',
                '--config', 'core.symlinks=false',
                repo_url,
                str(self.repo_dir)
            ], check=True, capture_output=True)
            
            # Initialize git config
            repo = git.Repo(str(self.repo_dir))
            
            # Now checkout the files
            repo.git.checkout('HEAD')
            
        except Exception as e:
            logger.error(f"Error cloning repository: {str(e)}")
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _generate_ai_review(self, repo_url: str, tree: str, content: str) -> AnalysisResult:
        """Generate project summary using Mistral"""
        
        # Load prompt template from external file or environment
        prompt = self._get_analysis_prompt(tree, content)

        try:
            logger.info(f"Sending request to Hugging Face API for repository: {repo_url}")
            # Call Hugging Face API
            response = requests.post(
                self.API_URL,
                headers=self.hf_headers,
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_length": 2000,  # Reduced for summary
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "return_full_text": False
                    }
                },
                timeout=30  # Add timeout
            )
            
            response.raise_for_status()
            
            # Parse response
            response_json = response.json()
            #logger.debug(f"API Response: {response_json}")
            
            if not response_json or not isinstance(response_json, list) or len(response_json) == 0:
                logger.error("Invalid response format from API")
                return self._generate_basic_review()
                
            analysis = response_json[0].get('generated_text', '')
            if not analysis:
                logger.error("No generated text in API response")
                return self._generate_basic_review()
                
            logger.info("Successfully received analysis from API")
            return self._parse_ai_analysis(analysis)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error generating AI review: {str(e)}")
            return self._generate_basic_review()

    def _parse_ai_analysis(self, analysis: str) -> AnalysisResult:
        """Parse AI response into structured format"""
        try:
            # Split into sections and ensure we have content
            json_analysis = json.loads(analysis)
            print("Analysis from API: ", json_analysis)

            return json_analysis
            # sections = [s.strip() for s in analysis.split('\n\n') if s.strip()]
            # print("\n\n\nSections: ", sections)
            # if not sections:
            #     logger.error("Empty analysis received from API")
            #     return self._generate_basic_review()
            
            # # Extract project name from repo URL or content
            # project_name = sections[0].split('\n')[0] if sections else "Unknown Project"
            
            # # Get main summary
            # summary = sections[0] if len(sections) > 0 else "No summary available"
            
            # # Extract features and technologies
            # features = []
            # technologies = []
            
            # for section in sections:
            #     lines = [line.strip('- ').strip() for line in section.split('\n')]
            #     if 'feature' in section.lower() or 'component' in section.lower():
            #         features.extend([line for line in lines[1:] if line])
            #     elif 'technolog' in section.lower() or 'framework' in section.lower() or 'built with' in section.lower():
            #         technologies.extend([line for line in lines[1:] if line])
            
            # return AnalysisResult(
            #     project_name=json_analysis['name'],
            #     summary=json_analysis['description'],
            #     technologies=json_analysis['technologies'] if json_analysis['technologies'] else ["Technologies not specified"]
            # )
            
        except Exception as e:
            logger.error(f"Error parsing AI analysis: {str(e)}")
            return self._generate_basic_review()

    def _generate_basic_review(self) -> AnalysisResult:
        """Generate basic review when analysis fails"""
        return AnalysisResult(
            project_name="Unknown Project",
            description="Unable to analyze the project. Please try again.",
            technologies=["Analysis failed"],
            metrics={
                "bugs": 0,
                "vulnerabilities": 0,
                "code_smells": 0,
                "security_hotspots": 0
            },
            issues=[],
            security_hotspots=[]
        )

    def _get_analysis_prompt(self, tree: str, content: str) -> str:
        """Get the analysis prompt template"""
        return f"""<s>[INST] You are a coding expert. Please provide a concise project overview of this codebase.

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


# from dotenv import load_dotenv
# analyzer = RepoAnalyzer(
#     github_token=os.getenv('GITHUB_TOKEN'),
#     huggingface_token=os.getenv('HUGGINGFACE_TOKEN')
# )
# test_repo = "https://github.com/zhanymkanov/fastapi-best-practices.git"
# result = analyzer.analyze_repository(test_repo)
# #print(result)