from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField

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
    analysis_status = models.CharField(
        max_length=20, 
        choices=[
            ('pending', 'Pending'),
            ('analyzing', 'Analyzing'),
            ('complete', 'Complete'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    analysis_results = JSONField(default=dict, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Assessment(models.Model):
    repository = models.ForeignKey(LinkedRepository, on_delete=models.CASCADE, related_name='assessments')
    questions = JSONField()  # Stores questions, options, and correct answers
    correct_answers = models.IntegerField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AssessmentAttempt(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='attempts')
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE)
    answers = JSONField()  # Stores user's answers
    correct_answers = models.IntegerField()
    score = models.IntegerField()
    time_spent = models.IntegerField()  # Time spent in seconds
    completed_at = models.DateTimeField(auto_now_add=True)