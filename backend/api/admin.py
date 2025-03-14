from django.contrib import admin
from .models import User, CandidateProfile, LinkedRepository, Assessment, AssessmentAttempt

# Register your models here.
admin.site.register(User)
admin.site.register(CandidateProfile)
admin.site.register(LinkedRepository)
admin.site.register(Assessment)
admin.site.register(AssessmentAttempt)
