import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Calendar, MapPin, Book, Users } from 'lucide-react';
import { profileService } from '../services/profile';

type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
type Education = 'high-school' | 'bachelors' | 'masters' | 'phd' | 'other';

export default function CandidateProfileSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '' as Gender,
    location: '',
    education_level: '' as Education,
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setFormData({
          full_name: profile.full_name || '',
          age: profile.age?.toString() || '',
          gender: profile.gender as Gender || '',
          location: profile.location || '',
          education_level: profile.education_level as Education || '',
          bio: profile.bio || ''
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const educationOptions = [
    { value: 'high-school', label: 'High School' },
    { value: 'bachelors', label: 'Bachelor\'s Degree' },
    { value: 'masters', label: 'Master\'s Degree' },
    { value: 'phd', label: 'Ph.D.' },
    { value: 'other', label: 'Other' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await profileService.updateProfile({
        ...formData,
        age: parseInt(formData.age, 10)
      });
      
      // Check if user has GitHub connected
      const hasGithub = localStorage.getItem('has_github') === 'true';
      if (!hasGithub) {
        navigate('/connect-github');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#1a1f2e] text-white flex items-center justify-center">
      Loading...
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <GraduationCap size={48} className="text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Help employers understand your background better</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-[#0A0C10] rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="age" className="block text-sm font-medium text-gray-300">
                  Age
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="18"
                    max="100"
                    className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="Enter your age"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                  Gender
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white appearance-none"
                    required
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>
          </div>

          {/* Education and About */}
          <div className="bg-[#0A0C10] rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Education & Background</h2>

            <div className="space-y-2">
              <label htmlFor="education_level" className="block text-sm font-medium text-gray-300">
                Highest Education Level
              </label>
              <div className="relative">
                <Book className="absolute left-3 top-3 text-gray-400" size={20} />
                <select
                  id="education_level"
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleChange}
                  className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white appearance-none"
                  required
                >
                  <option value="">Select education level</option>
                  {educationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
                About You
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg p-4 focus:outline-none focus:border-blue-500 text-white resize-none"
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}