import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';
import axios from 'axios';
import { getAuthHeader } from '../services/auth';

const API_URL = 'http://localhost:8000/api';

export default function ConnectGithub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectGithub = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get GitHub OAuth URL from backend
      const response = await axios.get(
        `${API_URL}/github/oauth-url/`,
        { headers: getAuthHeader() }
      );

      // Open GitHub OAuth in a new window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        response.data.url,
        'Github Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for the OAuth callback
      window.addEventListener('message', async function handleCallback(event) {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'github-oauth-callback') {
          authWindow?.close();
          
          try {
            // Send code to backend
            await axios.post(
              `${API_URL}/github/callback/`,
              { code: event.data.code },
              { headers: getAuthHeader() }
            );
            
            // Update local storage to indicate GitHub is connected
            localStorage.setItem('has_github', 'true');
            
            // Navigate to dashboard on success
            navigate('/dashboard');
          } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to connect GitHub account';
            setError(errorMessage);
            
            // If the error is about already linked account, make it more user-friendly
            if (errorMessage.includes('already linked')) {
              setError('This GitHub account is already connected to another SkillScout user. Please use a different GitHub account.');
            }
          }
          
          window.removeEventListener('message', handleCallback);
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start GitHub connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Github size={48} className="text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Connect GitHub Account</h1>
          <p className="text-gray-400">
            Link your GitHub account to showcase your projects and skills
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-[#0A0C10] rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-gray-300">
              By connecting your GitHub account, you'll be able to:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Showcase your best projects</li>
              <li>Display your coding activity</li>
              <li>Highlight your technical skills</li>
              <li>Share your open source contributions</li>
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleConnectGithub}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Github size={20} />
              <span>{loading ? 'Connecting...' : 'Connect GitHub'}</span>
            </button>

            <button
              onClick={handleSkip}
              className="w-full bg-transparent hover:bg-gray-800 text-gray-400 py-3 rounded-lg transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}