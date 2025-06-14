# Generated by Django 5.0.3 on 2025-03-14 20:21

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_assessment_assessmentattempt'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmployerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_name', models.CharField(max_length=100)),
                ('company_overview', models.TextField(blank=True)),
                ('work_type', models.CharField(choices=[('remote', 'Remote'), ('hybrid', 'Hybrid'), ('onsite', 'On-site')], max_length=10)),
                ('location', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='employer_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
