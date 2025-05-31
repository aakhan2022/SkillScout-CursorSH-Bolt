from rest_framework import serializers
from .models import User, CandidateProfile, LinkedRepository, Assessment, AssessmentAttempt, EmployerProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password', 'role')
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'role': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user

class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = ('id', 'full_name', 'age', 'gender', 'location', 'education_level', 'bio', 'skills', 'experience_years', 'github_username')
        read_only_fields = ('id',)

class EmployerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployerProfile
        fields = ('id', 'company_name', 'company_overview', 'work_type', 'location')
        read_only_fields = ('id',)

class LinkedRepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkedRepository
        fields = ('id', 'repo_name', 'repo_url', 'description', 'languages', 'analysis_status', 'analysis_results')

class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = ('id', 'repository', 'questions', 'score', 'completed_at', 'created_at')
        read_only_fields = ('id', 'created_at')

class AssessmentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentAttempt
        fields = ('id', 'assessment', 'answers', 'score', 'time_spent', 'completed_at')
        read_only_fields = ('id', 'completed_at')

class CandidateListSerializer(serializers.ModelSerializer):
    """Serializer for listing candidates in employer dashboard"""
    user = UserSerializer(read_only=True)
    repositories = LinkedRepositorySerializer(many=True, read_only=True)
    skill_score = serializers.SerializerMethodField()
    
    class Meta:
        model = CandidateProfile
        fields = ('id', 'user', 'full_name', 'location', 'education_level', 'skills', 
                 'experience_years', 'repositories', 'skill_score')
    
    def get_skill_score(self, obj):
        """Calculate skill score based on assessments and repository analysis"""
        repositories = obj.repositories.all()
        if not repositories:
            return 0
            
        total_score = 0
        count = 0
        
        for repo in repositories:
            # Get latest assessment
            latest_assessment = repo.assessments.order_by('-created_at').first()
            if latest_assessment and latest_assessment.score:
                total_score += latest_assessment.score
                count += 1
                
            # Consider analysis results if available
            if repo.analysis_results and repo.analysis_status == 'complete':
                code_quality = repo.analysis_results.get('code_quality', {})
                metrics = code_quality.get('metrics', {})
                
                # Calculate score based on various metrics
                if metrics:
                    metric_score = 0
                    if metrics.get('maintainability_rating') == 'A':
                        metric_score += 100
                    elif metrics.get('maintainability_rating') == 'B':
                        metric_score += 80
                    
                    bugs = metrics.get('bugs', 0)
                    code_smells = metrics.get('code_smells', 0)
                    vulnerabilities = metrics.get('vulnerabilities', 0)
                    
                    # Deduct points for issues
                    metric_score -= (bugs * 5 + code_smells * 2 + vulnerabilities * 10)
                    metric_score = max(0, metric_score)  # Ensure score doesn't go below 0
                    
                    total_score += metric_score
                    count += 1
        
        return round(total_score / count) if count > 0 else 0
    
class CandidateDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for candidate profile view"""
    repositories = LinkedRepositorySerializer(many=True, read_only=True)
    skill_score = serializers.SerializerMethodField()
    
    class Meta:
        model = CandidateProfile
        fields = (
            'id', 'full_name', 'location', 'education_level', 'bio',
            'skills', 'experience_years', 'repositories', 'skill_score'
        )
    
    def get_skill_score(self, obj):
        """Calculate skill score based on assessments and repository analysis"""
        repositories = obj.repositories.all()
        if not repositories:
            return 0
            
        total_score = 0
        count = 0
        
        for repo in repositories:
            # Get latest assessment
            latest_assessment = repo.assessments.order_by('-created_at').first()
            if latest_assessment and latest_assessment.score:
                total_score += latest_assessment.score
                count += 1
                
            # Consider analysis results if available
            if repo.analysis_results and repo.analysis_status == 'complete':
                code_quality = repo.analysis_results.get('code_quality', {})
                metrics = code_quality.get('metrics', {})
                
                # Calculate score based on various metrics
                if metrics:
                    metric_score = 0
                    if metrics.get('maintainability_rating') == 'A':
                        metric_score += 100
                    elif metrics.get('maintainability_rating') == 'B':
                        metric_score += 80
                    
                    bugs = metrics.get('bugs', 0)
                    code_smells = metrics.get('code_smells', 0)
                    vulnerabilities = metrics.get('vulnerabilities', 0)
                    
                    # Deduct points for issues
                    metric_score -= (bugs * 5 + code_smells * 2 + vulnerabilities * 10)
                    metric_score = max(0, metric_score)  # Ensure score doesn't go below 0
                    
                    total_score += metric_score
                    count += 1
        
        return round(total_score / count) if count > 0 else 0