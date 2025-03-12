from django.shortcuts import render
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from django.conf import settings
from .models import User, CandidateProfile, LinkedRepository
from .serializers import UserSerializer, CandidateProfileSerializer, LinkedRepositorySerializer
from .services.repo_analyzer import RepoAnalyzer
from .services.repo_analyzer import ErrorResponse
import json
from loguru import logger
import os
import shutil
import errno
import stat
# Create your views here.

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
                    return Response(
                        {'error': 'Analysis failed'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                analysis_json = review_data.to_json()
                
                # Update repository with analysis results
                repository.analysis_results = analysis_json
                repository.analysis_status = 'complete'
                repository.save()
                
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
            project.analysis_status = 'complete'
            project.save()
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
        analysis_json = review_data.to_json()
        
        print("\n\nanalysis_json: ", analysis_json)
        
        # Save review
        try:
            project.analysis_results = analysis_json
            project.analysis_status = 'complete'
            project.save()
        except Exception as e:
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