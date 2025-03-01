from rest_framework import serializers
from .models import User, CandidateProfile, LinkedRepository

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
        fields = ('id', 'full_name', 'age', 'gender', 'location', 'education_level', 'bio')
        read_only_fields = ('id',)

class LinkedRepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkedRepository
        fields = ('id', 'repo_name', 'repo_url', 'description', 'languages') 