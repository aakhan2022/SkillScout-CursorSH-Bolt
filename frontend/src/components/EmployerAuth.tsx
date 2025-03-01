import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup';

export default function EmployerAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (email.length < 5 || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      if (mode === 'signup' && !companyName) {
        throw new Error('Company name is required');
      }

      // Mock successful authentication
      localStorage.setItem('user_role', 'employer');
      localStorage.setItem('user_email', email);
      if (mode === 'signup') {
        localStorage.setItem('company_name', companyName);
        // Redirect to company profile setup for new accounts
        navigate('/company-profile-setup');
      } else {
        // Redirect to dashboard for existing accounts
        navigate('/emp-dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInAuth = () => {
    alert('LinkedIn Business authentication coming soon!');
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex items-center space-x-3">
          <GraduationCap size={40} className="text-white" />
          <h1 className="text-3xl font-bold">SkillScout</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-light leading-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-400">
            {mode === 'signin' 
              ? 'Sign in to access your employer dashboard' 
              : 'Start hiring the best talent based on real skills'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-medium text-gray-300">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0C10] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                required
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0C10] border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1a1f2e] text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleLinkedInAuth}
          className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Linkedin size={20} />
          <span>Sign {mode === 'signin' ? 'in' : 'up'} with LinkedIn</span>
        </button>

        <p className="text-sm text-gray-400 text-center">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-400 hover:underline"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}