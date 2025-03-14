import requests
from typing import Dict, List, Optional
from dataclasses import dataclass
import json
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

@dataclass
class Question:
    text: str
    options: List[str]
    correct_answer: int
    explanation: str

@dataclass
class Assessment:
    questions: List[Question]

class AssessmentGenerator:
    def __init__(self, huggingface_token: str):
        self.API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        self.headers = {"Authorization": f"Bearer {huggingface_token}"}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def generate_assessment(self, project_info: Dict) -> Optional[Assessment]:
        """Generate assessment questions based on project analysis"""
        try:
            prompt = self._create_assessment_prompt(project_info)
            
            response = requests.post(
                self.API_URL,
                headers=self.headers,
                json={
                    "inputs": prompt,
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
            
            if not response_json or not isinstance(response_json, list):
                logger.error("Invalid API response format")
                return None
                
            questions_data = self._parse_response(response_json[0]['generated_text'])
            if not questions_data:
                return None
                
            questions = [
                Question(
                    text=q['question'],
                    options=q['options'],
                    correct_answer=q['correct_answer'],
                    explanation=q['explanation']
                )
                for q in questions_data
            ]
            
            return Assessment(questions=questions)
            
        except Exception as e:
            logger.error(f"Failed to generate assessment: {str(e)}")
            return None

    def _create_assessment_prompt(self, project_info: Dict) -> str:
        """Create prompt for assessment generation"""
        try:
            technologies = project_info.get('project_info', {}).get('technologies', [])
            description = project_info.get('project_info', {}).get('description', '')
            code_quality = project_info.get('code_quality', {})
            metrics = code_quality.get('metrics', {})
            
            tech_list = ', '.join(technologies) if technologies else 'No technologies specified'
            
            prompt = (
                "You are an expert technical interviewer. Create 5 multiple-choice questions to assess understanding of this project.\n\n"
                f"Project Description:\n{description}\n\n"
                f"Technologies Used:\n{tech_list}\n\n"
                "Create 5 questions that test:\n"
                "1. Understanding of the project's architecture and design\n"
                "2. Knowledge of the technology stack\n"
                "3. Knowledge of the technology stack\n"
                "4. Understanding of the project's architecture and design\n"
                "5. Knowledge of the technology stack\n\n"
                "For each question:\n"
                "- Make it specific to the project context\n"
                "- Provide 4 options (A, B, C, D)\n"
                "- Include a detailed explanation for the correct answer\n\n"
                "Your response must be a valid JSON array containing exactly 5 questions.\n"
                "Each question must have these exact fields:\n"
                "- question: The question text\n"
                "- options: Array of 4 strings with options prefixed by A), B), C), D)\n"
                "- correct_answer: Integer 0-3 indicating the correct option index\n"
                "- explanation: String explaining why the answer is correct\n\n"
                "Example format:\n"
                "[\n"
                "  {\n"
                '    "question": "What is the primary purpose of this project?",\n'
                '    "options": [\n'
                '      "A) Option one",\n'
                '      "B) Option two",\n'
                '      "C) Option three",\n'
                '      "D) Option four"\n'
                "    ],\n"
                '    "correct_answer": 2,\n'
                '    "explanation": "Option C is correct because..."\n'
                "  }\n"
                "]\n\n"
                "Respond ONLY with the JSON array, no other text or formatting. Make sure correct_answer aligns with correct option"
            )
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error creating assessment prompt: {str(e)}")
            return ""

    def _parse_response(self, response_text: str) -> Optional[List[Dict]]:
        """Parse API response into structured question format"""
        try:
            # Clean up the response text
            clean_text = response_text.strip()
            
            # Find the first '[' and last ']' to extract just the JSON array
            start = clean_text.find('[')
            end = clean_text.rfind(']')
            
            if start == -1 or end == -1:
                logger.error("Could not find JSON array markers")
                return None
                
            json_text = clean_text[start:end + 1]
            
            # Parse the JSON
            questions = json.loads(json_text)
            
            # Validate response format
            if not isinstance(questions, list):
                logger.error("Response is not a list")
                return None
                
            # Take only the first 5 questions if more were generated
            questions = questions[:5]
            
            # Validate each question
            for q in questions:
                if not all(k in q for k in ['question', 'options', 'correct_answer', 'explanation']):
                    logger.error("Missing required question fields")
                    return None
                    
                if not isinstance(q['options'], list) or len(q['options']) != 4:
                    logger.error("Invalid options format")
                    return None
                    
                if not isinstance(q['correct_answer'], int) or q['correct_answer'] not in range(4):
                    logger.error("Invalid correct_answer format")
                    return None
            
            return questions
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse response JSON: {str(e)}")
            logger.error(f"Response text: {response_text}")
            return None
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            return None