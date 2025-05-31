import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Globe2 } from 'lucide-react';
import { employerService } from '../services/employer';
import type { EmployerProfile } from '../services/employer';

type WorkType = 'remote' | 'hybrid' | 'onsite';

export default function CompanyProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'overview' | 'location'>('overview');
  const [overview, setOverview] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await employerService.getProfile();
        if (profile) {
          setOverview(profile.company_overview || '');
          setWorkType(profile.work_type || '');
          setLocation(profile.location || '');
        }
      } catch (error) {
        // Ignore error - this is expected for new profiles
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!overview || !workType) {
        throw new Error('Please fill in all required fields');
      }

      if ((workType === 'hybrid' || workType === 'onsite') && !location) {
        throw new Error('Please provide company location');
      }

      const profileData: Partial<EmployerProfile> = {
        company_overview: overview,
        work_type: workType,
        location: location || ''
      };

      await employerService.updateProfile(profileData);
      navigate('/emp-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkTypeSelect = (type: WorkType) => {
    setWorkType(type);
    if (type === 'hybrid' || type === 'onsite') {
      setStep('location');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Building2 size={48} className="text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Complete Your Company Profile</h1>
          <p className="text-gray-400">Help candidates understand your company better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 'overview' ? (
            <>
              <div className="space-y-4">
                <label className="block text-lg font-medium mb-2">
                  Company Overview
                </label>
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="w-full h-32 bg-[#0A0C10] border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-blue-500"
                  placeholder="Tell candidates about your company, culture, and mission..."
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium mb-2">
                  Work Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleWorkTypeSelect('remote')}
                    className={`p-4 rounded-lg border ${
                      workType === 'remote'
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-[#0A0C10] border-gray-700 hover:bg-[#0f1218]'
                    } transition-colors`}
                  >
                    <Globe2 className="mx-auto mb-2" size={24} />
                    <div className="font-medium">Remote</div>
                    <div className="text-sm text-gray-400">Work from anywhere</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkTypeSelect('hybrid')}
                    className={`p-4 rounded-lg border ${
                      workType === 'hybrid'
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-[#0A0C10] border-gray-700 hover:bg-[#0f1218]'
                    } transition-colors`}
                  >
                    <Building2 className="mx-auto mb-2" size={24} />
                    <div className="font-medium">Hybrid</div>
                    <div className="text-sm text-gray-400">Mix of remote & office</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkTypeSelect('onsite')}
                    className={`p-4 rounded-lg border ${
                      workType === 'onsite'
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-[#0A0C10] border-gray-700 hover:bg-[#0f1218]'
                    } transition-colors`}
                  >
                    <MapPin className="mx-auto mb-2" size={24} />
                    <div className="font-medium">On-site</div>
                    <div className="text-sm text-gray-400">Work from office</div>
                  </button>
                </div>
              </div>

              {workType === 'remote' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="block text-lg font-medium mb-2">
                  Company Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter company location"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('overview');
                    setWorkType('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}