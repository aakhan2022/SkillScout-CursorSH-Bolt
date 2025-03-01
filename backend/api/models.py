from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField

# Create your models here.

class User(AbstractUser):
    ROLE_CHOICES = (
        ('candidate', 'Candidate'),
        ('employer', 'Employer'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    github_token = models.CharField(max_length=255, null=True, blank=True)
    
class CandidateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    full_name = models.CharField(max_length=100, blank=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    education_level = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    skills = JSONField(default=list)
    experience_years = models.IntegerField(default=0)
    github_username = models.CharField(max_length=100, null=True, blank=True, unique=True)

class LinkedRepository(models.Model):
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name='repositories')
    repo_name = models.CharField(max_length=255)
    repo_url = models.URLField()
    description = models.TextField(blank=True)
    languages = JSONField(default=list)
    analysis_status = models.CharField(max_length=20, default='pending')
    last_analyzed = models.DateTimeField(null=True)
    analysis_results = JSONField(default=dict)
