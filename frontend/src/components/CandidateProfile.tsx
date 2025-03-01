import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Star, Trophy, MapPin, Briefcase, Github, ChevronDown } from 'lucide-react';

// Mock candidate data
const mockCandidate = {
  id: '1',
  name: 'Alex Thompson',
  title: 'Senior Full Stack Developer',
  location: 'San Francisco, CA',
  skills: ['React', 'Node.js', 'Python', 'AWS', 'TypeScript'],
  experience: 6,
  education: 'MS Computer Science',
  skillScore: 92,
  profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=100&h=100',
  bio: 'Passionate full-stack developer with 6+ years of experience building scalable web applications. Focused on clean code and modern development practices.',
  githubRepos: [
    {
      id: 'repo1',
      name: 'e-commerce-platform',
      description: 'A modern e-commerce platform built with React and Node.js',
      stars: 245,
      forks: 45,
      language: 'TypeScript',
      url: 'https://github.com/alexthompson/e-commerce-platform',
      lastUpdated: '2024-02-15'
    },
    {
      id: 'repo2',
      name: 'react-state-manager',
      description: 'Lightweight state management solution for React applications',
      stars: 1200,
      forks: 180,
      language: 'TypeScript',
      url: 'https://github.com/alexthompson/react-state-manager',
      lastUpdated: '2024-01-20'
    }
  ]
};

export default function CandidateProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects'>('overview');

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <GraduationCap size={32} className="text-white" />
              <div className="text-2xl font-bold ml-2">SkillScout</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=32&h=32"
                    alt="Profile"
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{localStorage.getItem('company_name') || 'Company'}</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Candidate Header */}
      <div className="bg-[#1a1f2e] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <img
                src={mockCandidate.profileImage}
                alt={mockCandidate.name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold mb-2">{mockCandidate.name}</h1>
                <div className="flex items-center space-x-4 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Briefcase size={16} />
                    <span>{mockCandidate.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>{mockCandidate.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star size={16} />
                    <span>Score: {mockCandidate.skillScore}</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              Contact Candidate
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button 
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'projects' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('projects')}
            >
              Projects
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-300">{mockCandidate.bio}</p>
            </div>

            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {mockCandidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Experience & Education</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Briefcase className="text-blue-400" size={20} />
                  <span>{mockCandidate.experience} years of professional experience</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <GraduationCap className="text-blue-400" size={20} />
                  <span>{mockCandidate.education}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {mockCandidate.githubRepos.map((repo) => (
              <div 
                key={repo.id} 
                className="bg-[#1a1f2e] rounded-lg p-6 hover:bg-[#1e2436] transition-colors cursor-pointer"
                onClick={() => handleProjectClick(repo.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Github size={24} className="text-gray-400" />
                    <h3 className="text-xl font-medium">{repo.name}</h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>⭐ {repo.stars}</span>
                    <span>🔱 {repo.forks}</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{repo.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-400">{repo.language}</span>
                  <span className="text-sm text-gray-400">Last updated: {repo.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}