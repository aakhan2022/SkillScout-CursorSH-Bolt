from django.contrib import admin
from .models import User, CandidateProfile, LinkedRepository

# Register your models here.
admin.site.register(User)
admin.site.register(CandidateProfile)
admin.site.register(LinkedRepository)
