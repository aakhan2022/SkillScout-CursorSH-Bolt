from django.contrib import admin
from django.urls import path, include
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', views.register_candidate, name='register'),
    path('api/auth/login/', views.login, name='login'),
    path('api/github/oauth-url/', views.github_oauth_url, name='github-oauth-url'),
    path('api/github/callback/', views.github_callback, name='github-callback'),
    path('api/candidate/profile/', views.candidate_profile, name='candidate-profile'),
    path('api/github/repositories/', views.github_repositories, name='github-repositories'),
    path('api/repositories/add/', views.add_repository, name='add-repository'),
    path('api/repositories/', views.get_linked_repositories, name='get-repositories'),
    path('api/repositories/<str:repo_id>/', views.get_repository, name='get-repository'),
    path('api/repositories/<str:repo_id>/delete/', views.delete_repository, name='delete-repository'),
    path('api/repositories/<str:repo_id>/summary/', views.get_repo_summary, name='repository-summary'),
    path('api/repositories/<str:repo_id>/assessment/', views.get_assessment, name='get-assessment'),
    path('api/repositories/<str:repo_id>/assessment/generate/', views.generate_assessment, name='generate-assessment'),
    path('api/assessment/<str:assessment_id>/submit/', views.submit_assessment, name='submit-assessment'),
    path('api/repositories/<str:repo_id>/file/<path:file_path>/', views.get_file_content, name='get-file-content'),
    # New employer URLs
    path('api/auth/register/employer/', views.register_employer, name='register-employer'),
    path('api/employer/profile/', views.employer_profile, name='employer-profile'),
    path('api/employer/candidates/', views.search_candidates, name='search-candidates'),
    # New employer candidate profile URLs
    path('api/employer/candidates/<str:candidate_id>/', views.get_candidate_profile, name='candidate-profile'),
    path('api/employer/candidates/<str:candidate_id>/projects/<str:project_id>/', views.get_candidate_project, name='candidate-project'),
    

    path('api/repositories/<str:repo_id>/files/', views.get_repository_files, name='repository-files'),
    path('api/repositories/<str:repo_id>/files/content/', views.get_file_content, name='file-content'),
    path('api/repositories/<str:repo_id>/files/summary/', views.get_file_summary, name='file-summary'),



]