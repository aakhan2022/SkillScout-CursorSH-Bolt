import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Briefcase, GraduationCap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AuthCallback from './components/AuthCallback';
import ProjectDetails from './components/ProjectDetails';
import EmployerAuth from './components/EmployerAuth';
import EmployerDashboard from './components/EmployerDashboard';
import CandidateProfile from './components/CandidateProfile';
import CandidateAuth from './components/CandidateAuth';
import ConnectGithub from './components/ConnectGithub';
import CompanyProfileSetup from './components/CompanyProfileSetup';
import CandidateProfileSetup from './components/CandidateProfileSetup';

function LandingPage({ onRoleSelect }: { onRoleSelect: (role: 'candidate' | 'employer') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
      <div className="max-w-4xl mx-auto pt-20 px-4">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 mb-12">
            <GraduationCap size={48} className="text-white" />
            <h1 className="text-5xl font-bold">SkillScout</h1>
          </div>
          
          <p className="text-2xl text-gray-300 mb-12">Skill based hiring platform</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <button
              onClick={() => onRoleSelect('candidate')}
              className="px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
            >
              <GraduationCap size={24} />
              <span>Use as Candidate</span>
            </button>
            
            <button
              onClick={() => onRoleSelect('employer')}
              className="px-8 py-4 bg-transparent border-2 border-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2"
            >
              <Briefcase size={24} />
              <span>Use as Employer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'candidate' | 'employer'>('landing');

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            currentView === 'landing' ? (
              <LandingPage onRoleSelect={(role) => setCurrentView(role)} />
            ) : currentView === 'candidate' ? (
              <CandidateAuth />
            ) : (
              <EmployerAuth />
            )
          } 
        />
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/connect-github" element={<ConnectGithub />} />
        <Route path="/emp-dashboard" element={<EmployerDashboard />} />
        <Route path="/company-profile-setup" element={<CompanyProfileSetup />} />
        <Route path="/candidate-profile-setup" element={<CandidateProfileSetup />} />
        <Route path="/project/:projectId" element={<ProjectDetails />} />
        <Route path="/candidate/:candidateId" element={<CandidateProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;