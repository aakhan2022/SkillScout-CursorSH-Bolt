import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

type AuthMode = 'signin' | 'signup';

export default function CandidateAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (email.length < 5 || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (mode === 'signup') {
        await authService.register(email, password);
        navigate('/candidate-profile-setup');
      } else {
        const response = await authService.login(email, password);
        if (!response.user.has_github) {
          navigate('/connect-github');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        err.message || 
        'An error occurred during authentication'
      );
    } finally {
      setLoading(false);
    }
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
              ? 'Sign in to showcase your skills' 
              : 'Start your journey to better opportunities'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
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