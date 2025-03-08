"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
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
    path('api/repositories/<str:repo_id>/', views.delete_repository, name='delete-repository'),
    path('api/repositories/<str:repo_id>/summary/', views.get_repo_summary, name='repository-summary')
]
