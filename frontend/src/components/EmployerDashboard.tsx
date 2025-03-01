import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Star, Trophy, GraduationCap, Briefcase, MapPin, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Candidate = {
  id: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  experience: number;
  education: string;
  skillScore: number;
  profileImage: string;
};

// Mock candidate data
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    title: 'Senior Full Stack Developer',
    location: 'San Francisco, CA',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'TypeScript'],
    experience: 6,
    education: 'MS Computer Science',
    skillScore: 92,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=100&h=100'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    title: 'Frontend Developer',
    location: 'New York, NY',
    skills: ['React', 'Vue.js', 'JavaScript', 'Tailwind CSS'],
    experience: 3,
    education: 'BS Software Engineering',
    skillScore: 88,
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=100&h=100'
  },
  {
    id: '3',
    name: 'Michael Rodriguez',
    title: 'Backend Developer',
    location: 'Austin, TX',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    experience: 4,
    education: 'BS Computer Science',
    skillScore: 85,
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=100&h=100'
  },
  {
    id: '4',
    name: 'Emily Watson',
    title: 'Full Stack Developer',
    location: 'Seattle, WA',
    skills: ['React', 'Node.js', 'MongoDB', 'Express'],
    experience: 2,
    education: 'BS Information Technology',
    skillScore: 82,
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=100&h=100'
  },
  {
    id: '5',
    name: 'David Kim',
    title: 'DevOps Engineer',
    location: 'Boston, MA',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Python', 'Terraform'],
    experience: 5,
    education: 'MS Cloud Computing',
    skillScore: 90,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100'
  }
];

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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/company-profile-setup');
  };

  const handleViewProfile = (candidateId: string) => {
    navigate(`/candidate/${candidateId}`);
  };

  const filteredCandidates = useMemo(() => {
    let results = [...mockCandidates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(candidate =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.title.toLowerCase().includes(query) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Apply skills filter
    if (selectedSkills.length > 0) {
      results = results.filter(candidate =>
        selectedSkills.every(skill => candidate.skills.includes(skill))
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      if (sortBy === 'skillScore') {
        return b.skillScore - a.skillScore;
      }
      // Best match sorting (by number of matching skills and score)
      const aMatchingSkills = selectedSkills.filter(skill => a.skills.includes(skill)).length;
      const bMatchingSkills = selectedSkills.filter(skill => b.skills.includes(skill)).length;
      if (bMatchingSkills === aMatchingSkills) {
        return b.skillScore - a.skillScore;
      }
      return bMatchingSkills - aMatchingSkills;
    });

    return results;
  }, [searchQuery, selectedSkills, sortBy]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="bg-[#1a1f2e] rounded-lg p-6 hover:bg-[#1e2436] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={candidate.profileImage}
                    alt={candidate.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">{candidate.name}</h3>
                    <p className="text-gray-400 text-sm">{candidate.title}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">
                  <Star size={14} />
                  <span className="text-sm font-medium">{candidate.skillScore}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-400">
                  <MapPin size={16} />
                  <span className="text-sm">{candidate.location}</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-400">
                  <Briefcase size={16} />
                  <span className="text-sm">{candidate.experience} years experience</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-400">
                  <GraduationCap size={16} />
                  <span className="text-sm">{candidate.education}</span>
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
      </div>
    </div>
  );
}