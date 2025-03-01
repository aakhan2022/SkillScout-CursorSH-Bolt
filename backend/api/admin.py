from django.contrib import admin
from .models import User, CandidateProfile

# Register your models here.
admin.site.register(User)
admin.site.register(CandidateProfile)
