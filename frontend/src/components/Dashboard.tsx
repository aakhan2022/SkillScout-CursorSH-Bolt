import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Send, Trash2, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile';
import type { CandidateProfile } from '../services/profile';
import { githubService, type GithubRepo } from '../services/github';
import { repositoryService, type LinkedRepository } from '../services/repository';
import { authService } from '../services/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [projects, setProjects] = useState<LinkedRepository[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [pollingProjects, setPollingProjects] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await profileService.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const repos = await repositoryService.getRepositories();
        setProjects(repos);
        
        // Start polling for pending projects
        repos.forEach(repo => {
          if (repo.analysis_status === 'pending' || repo.analysis_status === 'analyzing') {
            startPollingProject(repo.id);
          }
        });
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const startPollingProject = (projectId: string) => {
    if (!pollingProjects.has(projectId)) {
      setPollingProjects(prev => new Set(prev).add(projectId));
      
      repositoryService.startPolling(
        projectId,
        (updatedRepo) => {
          setProjects(prev => 
            prev.map(repo => 
              repo.id === projectId ? updatedRepo : repo
            )
          );
          
          if (updatedRepo.analysis_status === 'complete' || updatedRepo.analysis_status === 'failed') {
            setPollingProjects(prev => {
              const newSet = new Set(prev);
              newSet.delete(projectId);
              return newSet;
            });
          }
        }
      );
    }
  };

  const addProject = async (repo: GithubRepo) => {
    try {
      const newProject = await repositoryService.addRepository({
        full_name: repo.full_name
      });
      setProjects(prev => [...prev, newProject]);
      setShowProjectDropdown(false);
      
      // Start polling the new project
      startPollingProject(newProject.id);
    } catch (error: any) {
      setRepoError(error.response?.data?.error || 'Failed to add project');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeleteConfirmation(projectId);
  };

  const confirmDelete = async (projectId: string) => {
    try {
      await repositoryService.deleteRepository(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      // Stop polling if project is being deleted
      setPollingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleProjectClick = (project: LinkedRepository) => {
    if (project.analysis_status === 'complete') {
      navigate(`/project/${project.id}`);
    }
  };

  const handleEditProfile = () => {
    setShowProfileDropdown(false);
    navigate('/candidate-profile-setup');
  };

  const handleLogout = () => {
    authService.logout();
    setShowProfileDropdown(false);
    navigate('/');
  };

  useEffect(() => {
    const hasGithub = localStorage.getItem('has_github') === 'true';
    if (!hasGithub) {
      navigate('/connect-github');
    }
  }, [navigate]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown') && !target.closest('.project-dropdown')) {
        setShowProfileDropdown(false);
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showProjectDropdown) {
      const fetchRepositories = async () => {
        try {
          setLoadingRepos(true);
          setRepoError(null);
          const repos = await githubService.getRepositories();
          setRepositories(repos);
        } catch (error: any) {
          setRepoError(error.response?.data?.error || 'Failed to fetch repositories');
        } finally {
          setLoadingRepos(false);
        }
      };

      fetchRepositories();
    }
  }, [showProjectDropdown]);

  const submitFeedback = () => {
    setFeedback('');
    setShowFeedback(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold">SkillScout</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative profile-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowProjectDropdown(false);
                  }}
                  className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2 hover:bg-gray-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {firstName[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span>{firstName}</span>
                  <ChevronDown size={16} />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Edit Profile</span>
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
          <h1 className="text-2xl font-semibold">Manage Projects</h1>
          <div className="relative project-dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProjectDropdown(!showProjectDropdown);
                setShowProfileDropdown(false);
              }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Add Project</span>
            </button>

            {showProjectDropdown && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
                {loadingRepos ? (
                  <div className="px-4 py-3 text-gray-400">Loading repositories...</div>
                ) : repoError ? (
                  <div className="px-4 py-3 text-red-400">{repoError}</div>
                ) : repositories.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400">No repositories found</div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {repositories.map((repo) => (
                      <button
                        key={repo.full_name}
                        onClick={() => addProject(repo)}
                        className="w-full px-4 py-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-0"
                      >
                        <div className="font-medium">{repo.full_name}</div>
                        {repo.description && (
                          <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {repo.description}
                          </div>
                        )}
                        {repo.language && (
                          <div className="text-sm text-blue-400 mt-1">
                            {repo.language}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {loadingProjects ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              No projects connected
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors ${
                  project.analysis_status === 'complete'
                    ? 'cursor-pointer'
                    : 'opacity-70 cursor-not-allowed'
                }`}
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{project.repo_name}</h3>
                    {project.description && (
                      <p className="text-gray-400 mt-1">{project.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.analysis_status === 'complete' && project.analysis_results?.project_info?.technologies ? (
                        project.analysis_results.project_info.technologies.map((tech: string) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-blue-900/20 text-blue-400 rounded-full text-sm"
                          >
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">
                          Technologies will be shown after analysis
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, project.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  {project.analysis_status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                      <span className="text-yellow-400">Analysis Pending...</span>
                    </div>
                  )}
                  {project.analysis_status === 'analyzing' && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                      <span className="text-blue-400">Analyzing...</span>
                    </div>
                  )}
                  {project.analysis_status === 'failed' && (
                    <span className="text-red-400">Analysis Failed</span>
                  )}
                  {project.analysis_status === 'complete' && (
                    <span className="text-green-400">Analysis Complete</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback Button and Modal */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowFeedback(true)}
          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Send size={16} />
          <span>Send Feedback</span>
        </button>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Send Feedback</h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full h-32 bg-gray-700 rounded-lg p-3 text-white resize-none"
              placeholder="Tell us what you think..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Delete Project?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmation)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}