import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Star, Trophy, GraduationCap, Briefcase, MapPin, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employerService, type Candidate } from '../services/employer';
import { authService } from '../services/auth';

const skillOptions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django',
  'JavaScript', 'TypeScript', 'AWS', 'Docker', 'Kubernetes',
  'PostgreSQL', 'MongoDB', 'Express', 'Tailwind CSS', 'Terraform'
];

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'bestMatch' | 'skillScore'>('bestMatch');
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await employerService.searchCandidates({
          q: searchQuery,
          skills: selectedSkills,
          sort_by: sortBy === 'skillScore' ? 'skill_score' : 'best_match'
        });
        setCandidates(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch candidates');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedSkills, sortBy]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/company-profile-setup');
  };

  const handleViewProfile = (candidateId: string) => {
    navigate(`/candidate/${candidateId}`);
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
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2"
                >
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=32&h=32"
                    alt="Profile"
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{localStorage.getItem('company_name') || 'Company'}</span>
                  <ChevronDown size={16} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Edit Company Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-red-400"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Find Candidates</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'bestMatch' | 'skillScore')}
                className="bg-[#1a1f2e] text-white px-4 py-2 rounded-lg border border-gray-700 appearance-none pr-10"
              >
                <option value="bestMatch">Best Match</option>
                <option value="skillScore">Highest Score</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-[#1a1f2e] px-4 py-2 rounded-lg border border-gray-700"
            >
              <SlidersHorizontal size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, title, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>

          {showFilters && (
            <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => {
                      setSelectedSkills(prev =>
                        prev.includes(skill)
                          ? prev.filter(s => s !== skill)
                          : [...prev, skill]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSkills.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedSkills([])}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Candidates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
            {error}
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-lg p-8 text-center text-gray-400">
            No candidates found matching your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="bg-[#1a1f2e] rounded-lg p-6 hover:bg-[#1e2436] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=random`}
                      alt={candidate.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium">{candidate.full_name}</h3>
                      <p className="text-gray-400 text-sm">{candidate.education_level}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">
                    <Star size={14} />
                    <span className="text-sm font-medium">{candidate.overall_score}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin size={16} />
                    <span className="text-sm">{candidate.location}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-gray-400">
                    <Briefcase size={16} />
                    <span className="text-sm">{candidate.experience_years} years experience</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <span
                        key={skill}
                        className={`px-2 py-1 rounded-full text-sm ${
                          selectedSkills.includes(skill)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleViewProfile(candidate.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}