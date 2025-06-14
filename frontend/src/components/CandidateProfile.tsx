import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Star, Trophy, MapPin, Briefcase, Github, ChevronDown, Mail } from 'lucide-react';
import { employerService, type CandidateDetail } from '../services/employer';
import ContactCandidateModal from './ContactCandidateModal';

export default function CandidateProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const getProjectTechnologies = () => {
    if (!candidate) return new Set<string>();

    const technologies = new Set<string>();
    
    // Add manually specified skills
    candidate.skills.forEach(skill => technologies.add(skill));

    return Array.from(technologies);
  };

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await employerService.getCandidateProfile(candidateId);
        setCandidate(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load candidate profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const handleProjectClick = (projectId: string) => {
    if (!candidateId) return;
    navigate(`/project/${projectId}?candidateId=${candidateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error || 'Failed to load candidate profile'}
        </div>
      </div>
    );
  }

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
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=random`}
                alt={candidate.full_name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold mb-2">{candidate.full_name}</h1>
                <div className="flex items-center space-x-4 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Briefcase size={16} />
                    <span>{candidate.education_level}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>{candidate.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star size={16} />
                    <span>Overall Score: {candidate.overall_score}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowContactModal(true)}
             className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
             >
               <Mail size={20} />
               <span>Contact Candidate</span>
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
              <p className="text-gray-300">{candidate.bio}</p>
            </div>

            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {getProjectTechnologies().map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Education</h2>
              <div className="space-y-4">
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <GraduationCap className="text-blue-400" size={20} />
                  <span>{candidate.education_level}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {candidate.repositories.map((repo) => (
              <div 
                key={repo.id} 
                className="bg-[#1a1f2e] rounded-lg p-6 hover:bg-[#1e2436] transition-colors cursor-pointer"
                onClick={() => handleProjectClick(repo.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Github size={24} className="text-gray-400" />
                    <h3 className="text-xl font-medium">{repo.repo_name}</h3>
                  </div>
                  {repo.analysis_status === 'complete' && (
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>⭐ {repo.analysis_results?.code_quality?.metrics?.maintainability_rating || 'N/A'}</span>
                      <span>🔱 {repo.analysis_results?.code_quality?.metrics?.reliability_rating || 'N/A'}</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-300 mb-4">{repo.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {repo.languages.map((lang: string) => (
                      <span key={lang} className="text-sm text-blue-400">{lang}</span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    Analysis: {repo.analysis_status === 'complete' ? 'Complete' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Contact Candidate Modal */}
      {candidate && (
        <ContactCandidateModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          candidateName={candidate.full_name}
          candidateId={candidateId!}
        />
      )}
    </div>
  );
}