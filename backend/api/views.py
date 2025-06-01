from django.shortcuts import render, get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from pathlib import Path
from typing import Dict, List, Optional
from django.conf import settings
from functools import reduce
import operator
from .models import User, CandidateProfile, LinkedRepository, Assessment, AssessmentAttempt, EmployerProfile
from .serializers import (
    CandidateDetailSerializer, UserSerializer, CandidateProfileSerializer, LinkedRepositorySerializer,
    AssessmentSerializer, AssessmentAttemptSerializer, EmployerProfile, EmployerProfileSerializer, CandidateListSerializer
)
from .services.repo_analyzer import RepoAnalyzer
from .services.repo_analyzer import ErrorResponse
from .services.assessment_generator import AssessmentGenerator
from django.utils import timezone
import json
from loguru import logger
import os
import shutil
import errno
import stat
from django.db.models import Q

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_repository(request, repo_id):
    try:
        repository = get_object_or_404(
            LinkedRepository,
            id=repo_id,
            candidate=request.user.candidate_profile
        )
        serializer = LinkedRepositorySerializer(repository)
        return Response(serializer.data)
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
def register_candidate(request):
    # Print request data for debugging
    print("Request data:", request.data)
    
    # Ensure all required fields are present
    data = {
        'email': request.data.get('email'),
        'username': request.data.get('username'),
        'password': request.data.get('password'),
        'role': 'candidate'  # Set role explicitly
    }
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        CandidateProfile.objects.create(user=user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    username = request.data.get('email')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(email=username)
        if user.check_password(password):
            refresh = RefreshToken.for_user(user)
            serializer = UserSerializer(user)
            
            # Check if user has GitHub connected
            has_github = bool(user.github_token)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'has_github': has_github  # Add this field
                }
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def github_oauth_url(request):
    return Response({
        'url': (
            f'https://github.com/login/oauth/authorize'
            f'?client_id={settings.GITHUB_CLIENT_ID}'
            f'&redirect_uri={settings.GITHUB_REDIRECT_URI}'
            f'&scope=repo user'
        )
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def github_callback(request):
    code = request.data.get('code')
    
    # Exchange code for access token
    response = requests.post(
        'https://github.com/login/oauth/access_token',
        data={
            'client_id': settings.GITHUB_CLIENT_ID,
            'client_secret': settings.GITHUB_CLIENT_SECRET,
            'code': code
        },
        headers={'Accept': 'application/json'}
    )
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get('access_token')
        
        # Get user's GitHub profile
        github_user = requests.get(
            'https://api.github.com/user',
            headers={'Authorization': f'token {access_token}'}
        ).json()
        
        github_username = github_user['login']
        
        # Check if this GitHub account is already linked
        try:
            existing_profile = CandidateProfile.objects.get(github_username=github_username)
            if existing_profile.user != request.user:
                return Response(
                    {'error': 'This GitHub account is already linked to another user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except CandidateProfile.DoesNotExist:
            pass
        
        # Update user profile
        profile = request.user.candidate_profile
        profile.github_username = github_username
        profile.save()
        
        # Store GitHub token
        request.user.github_token = access_token
        request.user.save()
        
        return Response({'message': 'GitHub account connected successfully'})
    
    return Response(
        {'error': 'Failed to connect GitHub account'}, 
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def candidate_profile(request):
    try:
        profile = request.user.candidate_profile
    except CandidateProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CandidateProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CandidateProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def github_repositories(request):
    user = request.user
    if not user.github_token:
        return Response(
            {'error': 'GitHub account not connected'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Fetch user's repositories from GitHub
        response = requests.get(
            'https://api.github.com/user/repos',
            headers={
                'Authorization': f'token {user.github_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
        )
        
        if response.status_code == 200:
            repos = response.json()
            # Filter and format the repository data
            formatted_repos = [{
                'full_name': repo['full_name'],
                'description': repo['description'],
                'language': repo['language']
            } for repo in repos]
            
            return Response(formatted_repos)
        
        return Response(
            {'error': 'Failed to fetch repositories'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_repository(request):
    try:
        repo_name = request.data.get('full_name')
        
        # Check if repository is already linked
        if LinkedRepository.objects.filter(
            candidate=request.user.candidate_profile,
            repo_name=repo_name
        ).exists():
            return Response(
                {'error': 'Repository already added'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get repository details from GitHub
        response = requests.get(
            f'https://api.github.com/repos/{repo_name}',
            headers={
                'Authorization': f'token {request.user.github_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
        )
        
        if response.status_code == 200:
            repo_data = response.json()
            
            # Create new linked repository with pending status
            repository = LinkedRepository.objects.create(
                candidate=request.user.candidate_profile,
                repo_name=repo_name,
                repo_url=repo_data['html_url'],
                description=repo_data.get('description', ''),
                languages=[repo_data.get('language', 'Unknown')],
                analysis_status='pending'  # Set initial status as pending
            )
            
            # Start analysis immediately
            try:
                analyzer = RepoAnalyzer(
                    github_token=settings.GITHUB_TOKEN,
                    huggingface_token=settings.HUGGINGFACE_TOKEN,
                    sonar_token=settings.SONAR_TOKEN,
                )
                
                # Generate review
                review_data = analyzer.analyze_repository(repository.repo_url)
                
                # Check if result is an error response
                if isinstance(review_data, ErrorResponse):
                    logger.error("Analysis failed:")
                    print(json.dumps(review_data.to_json(), indent=2))
                    repository.analysis_status = 'failed'
                    repository.save()
                    return Response(
                        {'error': 'Analysis failed'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                analysis_json = review_data.to_json()
                
                # Check if SonarQube analysis failed
                if not analysis_json.get('code_quality', {}).get('metrics'):
                    repository.analysis_status = 'failed'
                    repository.save()
                    return Response(
                        {'error': 'SonarQube analysis failed'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Update repository with analysis results
                repository.analysis_results = analysis_json
                repository.analysis_status = 'complete'
                repository.save()

                if repository.analysis_status == 'complete' and repository.analysis_results:
                    update_candidate_skills(repository)
                
            except Exception as e:
                repository.analysis_status = 'failed'
                repository.save()
                error_response = ErrorResponse(
                    error="Test Execution Failed",
                    details=str(e)
                )
                print(json.dumps(error_response.to_json(), indent=2))
                return Response(
                    error_response.to_json(),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            serializer = LinkedRepositorySerializer(repository)
            return Response(serializer.data)
            
        return Response(
            {'error': 'Failed to fetch repository details'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def update_candidate_skills(repo: LinkedRepository):
    """Update candidate skills based on repository analysis"""
    try:
        if not repo.analysis_results or 'project_info' not in repo.analysis_results:
            return
            
        # Get technologies from analysis results
        technologies = repo.analysis_results['project_info'].get('technologies', [])
        if not technologies:
            return
            
        # Get candidate's existing skills
        candidate = repo.candidate
        existing_skills = set(candidate.skills or [])
        
        # Add new technologies to skills
        updated_skills = list(existing_skills.union(technologies))
        
        # Update candidate profile
        candidate.skills = updated_skills
        candidate.save()
        
    except Exception as e:
        print(f"Error updating candidate skills: {str(e)}")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_linked_repositories(request):
    repositories = LinkedRepository.objects.filter(
        candidate=request.user.candidate_profile
    )
    serializer = LinkedRepositorySerializer(repositories, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_repository(request, repo_id):
    try:
        repository = LinkedRepository.objects.get(
            id=repo_id,
            candidate=request.user.candidate_profile
        )
        
        # Get the repository name from the full name (owner/repo)
        repo_name = repository.repo_name.split('/')[-1]
        
        # Construct the path to the cloned repository
        clone_path = os.path.join(settings.CLONED_REPOS_DIR, str(repo_name))
        print("clone_path: ", clone_path)

        # Define handler for read-only files
        def handle_remove_readonly(func, path, exc):
            excvalue = exc[1]
            if func in (os.rmdir, os.remove, os.unlink) and excvalue.errno == errno.EACCES:
                # Change file permissions to writeable
                os.chmod(path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
                # Try the operation again
                func(path)
            else:
                raise

        # Delete the cloned repository directory if it exists
        if os.path.exists(clone_path):
            try:
                shutil.rmtree(clone_path, onerror=handle_remove_readonly)
                print(f"Successfully deleted cloned repository at {clone_path}")
            except Exception as e:
                print(f"Error deleting cloned repository: {str(e)}")
                # Continue with deletion of database record even if file deletion fails
        
        # Delete the database record
        repository.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_repo_summary(request, repo_id):
    try:
        print("repo_id: ", repo_id)
        project = LinkedRepository.objects.get(id=repo_id)
        
        # Check if analysis_results already exists and is not empty
        if project.analysis_results and isinstance(project.analysis_results, dict):
            print("Returning existing analysis results")
            return Response(project.analysis_results)
            
        # If no existing analysis, perform new analysis
        print("Generating new analysis")
        analyzer = RepoAnalyzer(
            github_token=settings.GITHUB_TOKEN,
            huggingface_token=settings.HUGGINGFACE_TOKEN,
            sonar_token=settings.SONAR_TOKEN,
        )
        
        # Generate review
        review_data = analyzer.analyze_repository(project.repo_url)
        
        # Check if result is an error response
        if isinstance(review_data, ErrorResponse):
            project.analysis_status = 'failed'
            project.save()
            return Response(
                {'error': 'Analysis failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        analysis_json = review_data.to_json()
        
        # Check if SonarQube analysis failed
        if not analysis_json.get('code_quality', {}).get('metrics'):
            project.analysis_status = 'failed'
            project.save()
            return Response(
                {'error': 'SonarQube analysis failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        print("\n\nanalysis_json: ", analysis_json)
        
        # Save review
        try:
            project.analysis_results = analysis_json
            project.analysis_status = 'complete'
            project.save()
        except Exception as e:
            project.analysis_status = 'failed'
            project.save()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(analysis_json)

    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_assessment(request, repo_id):
    try:
        repository = get_object_or_404(
            LinkedRepository,
            id=repo_id,
            candidate=request.user.candidate_profile
        )
        
        if repository.analysis_status != 'complete':
            return Response(
                {'error': 'Repository analysis must be complete before generating assessment'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if assessment already exists
        existing_assessment = Assessment.objects.filter(repository=repository).first()
        if existing_assessment:
            serializer = AssessmentSerializer(existing_assessment)
            return Response(serializer.data)
            
        # Generate new assessment
        generator = AssessmentGenerator(settings.HUGGINGFACE_TOKEN)
        assessment_data = generator.generate_assessment(repository.analysis_results)
        
        if not assessment_data:
            return Response(
                {'error': 'Failed to generate assessment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Create assessment
        assessment = Assessment.objects.create(
            repository=repository,
            questions=[{
                'text': q.text,
                'options': q.options,
                'correct_answer': q.correct_answer,
                'explanation': q.explanation
            } for q in assessment_data.questions]
        )
        
        serializer = AssessmentSerializer(assessment)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assessment(request, assessment_id):
    try:
        assessment = get_object_or_404(Assessment, id=assessment_id)
        
        # Validate request data
        if not isinstance(request.data.get('answers'), list):
            return Response(
                {'error': 'Invalid answers format'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        answers = request.data['answers']
        time_spent = request.data.get('time_spent', 0)
        
        # Calculate score and correct answers
        correct_answers = sum(
            1 for i, answer in enumerate(answers)
            if answer == assessment.questions[i]['correct_answer']
        )
        score = (correct_answers / len(assessment.questions)) * 100
        
        # Create attempt
        attempt = AssessmentAttempt.objects.create(
            assessment=assessment,
            candidate=request.user.candidate_profile,
            answers=answers,
            correct_answers=correct_answers,
            score=score,
            time_spent=time_spent
        )
        
        # Update assessment if first attempt
        if not assessment.completed_at:
            assessment.score = score
            assessment.correct_answers = correct_answers
            assessment.completed_at = timezone.now()
            assessment.save()
        
        serializer = AssessmentAttemptSerializer(attempt)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assessment(request, repo_id):
    try:
        # Get the latest assessment for the repository
        assessment = Assessment.objects.filter(
            repository__id=repo_id,
            #repository__candidate=request.user.candidate_profile
        ).latest('created_at')
        
        # Get the latest attempt if assessment is completed
        if assessment.completed_at:
            latest_attempt = AssessmentAttempt.objects.filter(
                assessment=assessment,
                #candidate=request.user.candidate_profile
            ).latest('completed_at')
            
            # Include attempt data in response
            serializer = AssessmentSerializer(assessment)
            data = serializer.data
            data['correct_answers'] = latest_attempt.correct_answers
            data['answers'] = latest_attempt.answers
            return Response(data)
            
        serializer = AssessmentSerializer(assessment)
        return Response(serializer.data)
    
    except Assessment.DoesNotExist:
        return Response(
            {'error': 'Assessment not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_file_content(request, repo_id, file_path):
    try:
        repository = LinkedRepository.objects.get(id=repo_id)
        
        # Ensure the file path is within the cloned repository directory
        full_path = os.path.join(settings.CLONED_REPOS_DIR, repository.repo_name.split('/')[-1], file_path)
        print("FULL PATH:", full_path)
        
        # Security check to prevent directory traversal
        if not os.path.normpath(full_path).startswith(settings.CLONED_REPOS_DIR):
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as file:
                content = file.readlines()
                return Response({
                    'content': content
                })
        else:
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
def register_employer(request):
    """Register a new employer"""
    try:
        data = request.data.copy()
        data['role'] = 'employer'
        data['username'] = data.get('email')  # Use email as username
        
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create employer profile
            EmployerProfile.objects.create(
                user=user,
                company_name=data.get('company_name', '')
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def employer_profile(request):
    """Get or update employer profile"""
    try:
        profile = request.user.employer_profile
        
        if request.method == 'GET':
            serializer = EmployerProfileSerializer(profile)
            return Response(serializer.data)
            
        elif request.method == 'PUT':
            serializer = EmployerProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except EmployerProfile.DoesNotExist:
        return Response(
            {'error': 'Employer profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_candidates(request):
    """Search and filter candidates"""
    try:
        # Get query parameters
        search_query = request.GET.get('q', '').strip()
        skills = request.GET.getlist('skills[]', [])
        sort_by = request.GET.get('sort_by', 'best_match')
        
        # Start with all candidate profiles
        queryset = CandidateProfile.objects.all()
        
        # Apply text search filters
        if search_query:
            queryset = queryset.filter(
                Q(full_name__regex=rf'\b{search_query}\b') |
                Q(location__regex=rf'\b{search_query}\b') |
                Q(skills__regex=rf'\b{search_query}\b') |
                Q(education_level__regex=rf'\b{search_query}\b')
            )
        
        # Apply skills filter if specified
        if skills:
            # Filter candidates whose skills list contains any of the selected skills
            for skill in skills:
                queryset = queryset.filter(skills__regex=rf'\b{skill}\b')
        
        # Apply sorting
        if sort_by == 'skill_score':
            # Order by skill score (highest first)
            queryset = queryset.annotate(
                score=Cast('skill_score', IntegerField())
            ).order_by('-score')
        else:
            # Default 'best_match' sorting - order by name
            queryset = queryset.order_by('full_name')
        
        # Serialize and return results
        serializer = CandidateListSerializer(queryset, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_candidate_profile(request, candidate_id):
    """Get detailed candidate profile with projects"""
    try:
        # Ensure requester is an employer
        if request.user.role != 'employer':
            return Response(
                {'error': 'Only employers can view candidate profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get candidate profile
        candidate = CandidateProfile.objects.get(id=candidate_id)
        serializer = CandidateDetailSerializer(candidate)
        return Response(serializer.data)
        
    except CandidateProfile.DoesNotExist:
        return Response(
            {'error': 'Candidate not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_candidate_project(request, candidate_id, project_id):
    """Get detailed project information including assessment"""
    try:
        # Ensure requester is an employer
        if request.user.role != 'employer':
            return Response(
                {'error': 'Only employers can view candidate projects'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get project
        project = LinkedRepository.objects.get(
            id=project_id,
            candidate_id=candidate_id
        )
        
        # Get latest assessment
        assessment = Assessment.objects.filter(
            repository=project
        ).order_by('-created_at').first()
        
        # Combine project and assessment data
        project_data = LinkedRepositorySerializer(project).data
        if assessment:
            project_data['assessment'] = AssessmentSerializer(assessment).data
            
        return Response(project_data)
        
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Project not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_repository_files(request, repo_id):
    """Get repository file structure"""
    try:
        repo = LinkedRepository.objects.get(id=repo_id)
        repo_name = repo.repo_name.split("/")[-1]
        repo_path = os.path.join(settings.CLONED_REPOS_DIR, repo_name)
        print("REPO PATH:", repo_path)
        
        if not os.path.exists(repo_path):
            return Response(
                {'error': 'Repository files not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        def get_file_info(path: Path) -> Dict:
            """Get file metadata"""
            stats = path.stat()
            return {
                'name': path.name,
                'path': str(path.relative_to(repo_path)),
                'type': 'directory' if path.is_dir() else 'file',
                'size': stats.st_size if path.is_file() else None,
                'extension': path.suffix[1:] if path.suffix else None,
                'language': get_file_language(path)
            }
        
        def get_file_language(path: Path) -> Optional[str]:
            """Determine file language based on extension"""
            ext_map = {
                'ts': 'TypeScript',
                'tsx': 'TypeScript',
                'js': 'JavaScript',
                'jsx': 'JavaScript',
                'py': 'Python',
                'html': 'HTML',
                'css': 'CSS',
                'json': 'JSON',
                'md': 'Markdown'
            }
            return ext_map.get(path.suffix[1:])
        
        def scan_directory(path: Path) -> List[Dict]:
            """Recursively scan directory"""
            items = []
            try:
                for item in path.iterdir():
                    if item.name.startswith('.'):
                        continue
                        
                    info = get_file_info(item)
                    if item.is_dir():
                        info['children'] = scan_directory(item)
                    items.append(info)
            except Exception as e:
                print(f"Error scanning {path}: {e}")
            return sorted(items, key=lambda x: (x['type'] != 'directory', x['name']))
        
        file_tree = scan_directory(Path(repo_path))
        return Response(file_tree)
        
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_file_content(request, repo_id):
    """Get file content"""
    try:
        repo = LinkedRepository.objects.get(id=repo_id)
        file_path = request.GET.get('path')
        
        if not file_path:
            return Response(
                {'error': 'File path is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        repo_name = repo.repo_name.split("/")[-1]    
        full_path = os.path.join(settings.CLONED_REPOS_DIR, repo_name, file_path)
        full_path = os.path.normpath(full_path)
        
        # Security check - ensure path is within repo directory
        repo_dir = os.path.join(settings.CLONED_REPOS_DIR, repo_name)
        if not full_path.startswith(repo_dir):
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return Response({'content': content})
        except UnicodeDecodeError:
            return Response(
                {'error': 'File is not text-readable'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_file_summary(request, repo_id):
    """Generate AI summary for file"""
    try:
        repo = LinkedRepository.objects.get(id=repo_id)
        file_path = request.GET.get('path')
        prompt = request.GET.get('prompt')
        
        if not file_path:
            return Response(
                {'error': 'File path is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        repo_name = repo.repo_name.split("/")[-1]
        full_path = os.path.join(settings.CLONED_REPOS_DIR, repo_name, file_path)
        full_path = os.path.normpath(full_path)
        
        # Security check - ensure path is within repo directory
        repo_dir = os.path.join(settings.CLONED_REPOS_DIR, repo_name)
        if not full_path.startswith(repo_dir):
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Use the same Mistral model for consistency
            from api.services.repo_analyzer import RepoAnalyzer
            analyzer = RepoAnalyzer(
                settings.GITHUB_TOKEN,
                settings.HUGGINGFACE_TOKEN,
                settings.SONAR_TOKEN
            )

            prompt = f"""
You are a coding expert. Please analyze this file and provide a concise summary.

Context:
- File path:
{file_path}

- Source code:
{content}

Provide ONLY a JSON response in the following format, with no additional text or formatting:
           {{ 
            "purpose": "Brief description of the file's main purpose",
            "components": ["List of key components, functions, or classes"],
            "description": "Detailed analysis of the code structure and patterns"
           }}            

Focus on:
          1. The file's primary responsibility
          2. Key components and their roles
          3. Important dependencies and how they're used
          4. Code organization and patterns used
"""
            
            summary = analyzer._generate_ai_review(
                repo.repo_url,
                file_path,
                content,
                prompt
            )

            
            if isinstance(summary, dict) and summary.get('error'):
                return Response(
                    {'error': summary['error']},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            return Response(summary)
            
        except UnicodeDecodeError:
            return Response(
                {'error': 'File is not text-readable'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except LinkedRepository.DoesNotExist:
        return Response(
            {'error': 'Repository not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )