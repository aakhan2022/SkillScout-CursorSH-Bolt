import os
import subprocess
import time
import requests
from pathlib import Path
from loguru import logger
from dataclasses import dataclass
from typing import List, Dict, Optional
from dotenv import load_dotenv

@dataclass
class SonarQubeAnalysis:
    """Structured output for SonarQube analysis"""
    bugs: int
    vulnerabilities: int
    code_smells: int
    coverage: float
    duplicated_lines_density: float
    security_hotspots: int
    issues: List[Dict]

class SonarAnalyzer:
    def __init__(self, sonar_token: str, sonar_host: str = "http://localhost:9000"):
        self.sonar_token = sonar_token
        self.sonar_host = sonar_host
        self.headers = {"Authorization": f"Bearer {sonar_token}"}
        self.repo_path = None

    def analyze_repository(self, repo_path: str, project_key: str) -> Optional[Dict]:
        """Run SonarQube analysis on a repository"""
        try:
            # Ensure repo_path is absolute
            repo_path = str(Path(repo_path).resolve())
            self.repo_path = repo_path
            logger.info(f"Running SonarQube analysis on: {repo_path}")

            # Run SonarQube scanner
            scanner_result = self._run_sonar_scanner(repo_path, project_key)
            if scanner_result == False:
                logger.error("SonarQube scanner failed")
                return None

            if not self._wait_for_analysis_completion(project_key):
                logger.error("Analysis completion check failed or timed out")
                return None
            
            # Wait for analysis to complete and fetch results
            return self._fetch_analysis_results(project_key)

        except Exception as e:
            logger.error(f"Error in SonarQube analysis: {str(e)}")
            return None
    
    def _wait_for_analysis_completion(self, project_key: str, timeout: int = 300, interval: int = 10) -> bool:
        """
        Wait for SonarQube analysis to complete.
        
        Args:
            project_key: The project key to check
            timeout: Maximum time to wait in seconds (default: 5 minutes)
            interval: Time between checks in seconds (default: 10 seconds)
        """
        try:
            start_time = time.time()
            while (time.time() - start_time) < timeout:
                # Check analysis status
                status_url = f"{self.sonar_host}/api/ce/component"
                response = requests.get(
                    status_url,
                    headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"},
                    params={"component": project_key}
                )
                response.raise_for_status()
                
                data = response.json()
                queue = data.get('queue', [])
                
                # If queue is empty, analysis is complete
                if not queue:
                    # Double check if we have analysis results
                    metrics_url = f"{self.sonar_host}/api/measures/component"
                    metrics_response = requests.get(
                        metrics_url,
                        headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"},
                        params={
                            "component": project_key,
                            "metricKeys": "bugs"
                        }
                    )
                    
                    if metrics_response.status_code == 200:
                        return True
        except Exception as e:
            logger.error(f"Error checking analysis completion: {str(e)}")
            return False

    def _run_sonar_scanner(self, repo_path: str, project_key: str) -> bool:
        """Run SonarQube scanner on the repository"""
        try:
            # Prepare sonar-project.properties
            properties_file = Path(repo_path) / "sonar-project.properties"
            with open(properties_file, "w") as f:
                f.write(f"""
sonar.projectKey={project_key}
sonar.sources=.
sonar.host.url={self.sonar_host}
sonar.token={self.sonar_token}
sonar.python.version=3
sonar.sourceEncoding=UTF-8
sonar.exclusions=**/*.pyc,**/__pycache__/**,**/tests/**,**/.git/**
                """.strip())

            # Run scanner
            SONAR_SCANNER_PATH = r"D:\My Folder\University\FYP\sonarqube-25.1.0.102122\sonar-scanner-6.2.1.4610-windows-x64\bin\sonar-scanner.bat"

            cmd = [
                SONAR_SCANNER_PATH,
                f"-Dsonar.projectKey={project_key}",
                "-Dsonar.sources=.",
                f"-Dsonar.host.url={self.sonar_host}",
                f"-Dsonar.token={self.sonar_token}"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=repo_path)

            if result.returncode != 0:
                logger.error(f"SonarQube scanner failed: {result.stderr}")
                return False

            logger.info("SonarQube analysis completed successfully")
            return True

        except Exception as e:
            logger.error(f"Error running SonarQube scanner: {str(e)}")
            return False

    def _fetch_analysis_results(self, project_key: str) -> Dict:
        """Fetch analysis results from SonarQube API"""
        try:
            # Get project metrics
            metrics_url = f"{self.sonar_host}/api/measures/component"
            metrics_params = {
                "component": project_key,
                "metricKeys": (
                    "bugs,vulnerabilities,code_smells,security_hotspots,"
                    "cognitive_complexity,complexity,sqale_rating,"
                    "reliability_rating,security_rating,"
                )
            }
            
            metrics_response = requests.get(
                metrics_url, 
                headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"},
                params=metrics_params
            )
            metrics_response.raise_for_status()
            
            # Parse metrics
            metrics_data = metrics_response.json()
            measures = {
                m['metric']: float(m['value']) 
                for m in metrics_data.get('component', {}).get('measures', [])
            }

            # Get issues
            issues_url = f"{self.sonar_host}/api/issues/search"
            issues_params = {
                "componentKeys": project_key,
                "resolved": "false",
                "ps": 100,  # page size
            }
            
            issues_response = requests.get(
                issues_url,
                headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"},
                params=issues_params
            )
            issues_response.raise_for_status()
            
            issues_data = issues_response.json().get('issues', [])

            # Extract relevant issue details
            extracted_issues = []
            for issue in issues_data:
                component_path = issue.get("component", "").split(":")[-1]  # Extract relative file path
                text_range = issue.get("textRange", {})
                rule_key = issue.get("rule")

                code_snippet = None
                if component_path and text_range:
                    file_path = os.path.join(self.repo_path, component_path)
                    code_snippet = self._extract_code_snippet(file_path, text_range)

                rule_details = self._fetch_rule_details(rule_key)
                extracted_issues.append({
                    "message": issue.get("message"),
                    "severity": issue.get("severity"),
                    "type": issue.get("type"),
                    "component": issue.get("component"),
                    "file_path": str(Path(file_path).resolve()),
                    "textRange": issue.get("textRange", {}),
                    "code_snippet": code_snippet,
                    "introduction": rule_details.get("introduction"),
                    "root_cause": rule_details.get("root_cause")
                })

            # Fetch security hotspots
            security_hotspots = self._fetch_security_hotspots(project_key)

            

            return {
                "metrics": {
                    "bugs": int(measures.get("bugs", 0)),
                    "vulnerabilities": int(measures.get("vulnerabilities", 0)),
                    "code_smells": int(measures.get("code_smells", 0)),
                    "security_hotspots": int(measures.get("security_hotspots", 0)),
                    "cognitive_complexity": int(measures.get("cognitive_complexity", 0)),
                    "cyclomatic_complexity": int(measures.get("complexity", 0)),
                    "maintainability_rating": self._convert_rating(measures.get("sqale_rating", 1)),
                    "reliability_rating": self._convert_rating(measures.get("reliability_rating", 1)),
                    "security_rating": self._convert_rating(measures.get("security_rating", 1)),
                },
                "issues": extracted_issues,
                "security_hotspots": security_hotspots,
            }

        except Exception as e:
            logger.error(f"Error fetching SonarQube results: {str(e)}")
            return None
    
    def _convert_rating(self, rating: float) -> str:
        """Convert SonarQube rating from number to letter grade"""
        rating_map = {
            1: 'A',
            2: 'B',
            3: 'C',
            4: 'D',
            5: 'E'
        }
        return rating_map.get(int(rating), 'N/A')

    def _fetch_security_hotspots(self, project_key: str) -> List[Dict]:
        """Fetches security hotspots from SonarQube API."""
        try:
            hotspots_url = f"{self.sonar_host}/api/hotspots/search"
            params = {"projectKey": project_key}
            
            response = requests.get(hotspots_url, headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"}, params=params)
            response.raise_for_status()
            hotspots_data = response.json().get("hotspots", [])
            detailed_hotspots = []

            for hotspot in hotspots_data:
                hotspot_key = hotspot.get("key")
                component_path = hotspot.get("component", "").split(":")[-1]  # Extract relative file path
                text_range = hotspot.get("textRange", {})

                code_snippet = None
                if component_path and text_range:
                    file_path = os.path.join(self.repo_path, component_path)
                    code_snippet = self._extract_code_snippet(file_path, text_range)

                if component_path:
                    file_path = os.path.join(self.repo_path, component_path)

                details = self._fetch_hotspot_details(hotspot_key)
                detailed_hotspots.append({
                    "message": hotspot.get("message"),
                    "file_path": str(Path(file_path).resolve()),
                    "textRange": hotspot.get("textRange", {}),
                    "code_snippet": code_snippet,
                    "securityCategory": hotspot.get("securityCategory"),
                    "severity": hotspot.get("vulnerabilityProbability"),
                    "component": hotspot.get("component"),
                    "line": hotspot.get("line"),
                    "riskDescription": details.get("riskDescription"),
                })
            return detailed_hotspots
        
        except Exception as e:
            logger.error(f"Error fetching security hotspots: {str(e)}")
            return []

    def _fetch_hotspot_details(self, hotspot_key: str) -> dict:
        """Fetches detailed hotspot details from SonarQube API."""
        try:
            hotspot_url = f"{self.sonar_host}/api/hotspots/show?hotspot={hotspot_key}"
            response = requests.get(hotspot_url, headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"})
            response.raise_for_status()
            hotspot_data = response.json().get("rule", {})
            return {
                "riskDescription": hotspot_data.get("riskDescription"),
            }
        
        except Exception as e:
            logger.error(f"Error fetching hotspot details: {str(e)}")
            return {"vulnerability_reason": None, "recommendation": None}

    def _fetch_rule_details(self, rule_key: str) -> dict:
        """Fetches rule details including introduction and root cause."""
        try:
            rule_url = f"{self.sonar_host}/api/rules/show?key={rule_key}"
            rule_response = requests.get(rule_url, headers={"Authorization": f"Bearer squ_1016c1e9e0ddc97d2a3064825f1203b5293d444a"})
            rule_response.raise_for_status()
            rule_data = rule_response.json().get("rule", {}).get("descriptionSections", [])
            details = {"introduction": None, "root_cause": None}

            for section in rule_data:
                if section.get("key") == "introduction":
                    details["introduction"] = section.get("content")
                elif section.get("key") == "root_cause":
                    details["root_cause"] = section.get("content")
            return details

        except Exception as e:
            logger.error(f"Error fetching rule details for {rule_key}: {str(e)}")
            return {"introduction": None, "root_cause": None}

    def _extract_code_snippet(self, file_path: str, text_range: dict) -> str:
        """Extracts the relevant code snippet from a file based on SonarQube text range."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            start_line = text_range.get("startLine", 1) - 1  # Convert to 0-based index
            end_line = text_range.get("endLine", start_line) - 1
            start_offset = text_range.get("startOffset", 0)
            end_offset = text_range.get("endOffset", len(lines[start_line]))

            # Extract the specific portion of the code
            if start_line == end_line:
                snippet = lines[start_line][start_offset:end_offset]
            else:
                snippet = "".join(lines[start_line:end_line + 1])

            return snippet.strip()

        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            return None