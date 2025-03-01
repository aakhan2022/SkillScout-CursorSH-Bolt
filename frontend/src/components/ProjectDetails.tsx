import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bug, GraduationCap, ChevronRight, FileCode, Folder, Code, Shield, Database, Star, Award, Target, Zap } from 'lucide-react';
import Assessment from './Assessment';
import BugsView from './BugsView';
import CodeSmellsView from './CodeSmellsView';
import SecurityView from './SecurityView';

type FileType = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  summary?: string;
};

// Mock files data
const mockFiles: FileType[] = [
  {
    name: 'src',
    path: 'src',
    type: 'dir',
  },
  {
    name: 'components',
    path: 'src/components',
    type: 'dir',
  },
  {
    name: 'App.tsx',
    path: 'src/App.tsx',
    type: 'file',
    content: `import React from 'react';
import { BrowserRouter } from 'react-router-dom';
// ... rest of the file content
`,
    summary: 'Main application component that sets up routing and global layout.'
  },
  {
    name: 'Dashboard.tsx',
    path: 'src/components/Dashboard.tsx',
    type: 'file',
    content: `import React from 'react';
// Dashboard component implementation
`,
    summary: 'Dashboard view showing project overview and statistics.'
  }
];

// Mock project data
const mockProject = {
  name: "SkillScout",
  description: "A comprehensive platform designed to bridge the gap between developers and employers through skill-based hiring. The project features an innovative assessment system that evaluates technical capabilities through real-world project analysis, automated code review, and interactive technical assessments. It integrates with GitHub to analyze coding patterns, project structures, and development practices, providing meaningful insights for both candidates and employers.",
  technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase", "TailwindCSS"],
  team: [
    { name: "John Doe", role: "Frontend Developer" },
    { name: "Jane Smith", role: "Backend Developer" },
    { name: "Mike Johnson", role: "DevOps Engineer" }
  ],
  codeAnalysis: {
    overallScore: 8.5,
    assessmentScore: 92,
    codeQuality: {
      score: 8.7,
      details: "Clean code structure with good practices"
    },
    security: {
      score: 8.2,
      details: "Strong security measures with minor improvements needed"
    },
    maintainability: {
      score: 8.8,
      details: "Highly maintainable with good documentation"
    },
    performance: {
      score: 8.3,
      details: "Efficient with room for optimization"
    }
  },
  analytics: {
    codeQuality: {
      bugs: 2,
      vulnerabilities: 3,
      codeSmells: 5,
      coverage: 85
    },
    performance: {
      loadTime: "1.2s",
      firstContentfulPaint: "0.8s",
      timeToInteractive: "2.1s"
    },
    complexity: {
      cognitive: 15,
      cyclomatic: 8,
      maintainability: "A"
    }
  }
};

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState<'summary' | 'code' | 'analytics' | 'assessment'>('summary');
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showBugsView, setShowBugsView] = useState(false);
  const [showCodeSmellsView, setShowCodeSmellsView] = useState(false);
  const [showSecurityView, setShowSecurityView] = useState(false);

  const toggleFolder = (path: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (expandedFolders.has(path)) {
      newExpandedFolders.delete(path);
    } else {
      newExpandedFolders.add(path);
    }
    setExpandedFolders(newExpandedFolders);
  };

  const selectFile = (file: FileType) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  const FileExplorer = () => {
    const renderTree = (path: string = '', level: number = 0) => {
      return mockFiles
        .filter(file => {
          const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
          return path === '' ? !file.path.includes('/') : parentPath === path;
        })
        .map(file => (
          <div key={file.path} style={{ marginLeft: `${level * 20}px` }}>
            <button
              className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-gray-700 rounded-lg text-left"
              onClick={() => file.type === 'dir' ? toggleFolder(file.path) : selectFile(file)}
            >
              {file.type === 'dir' ? (
                <>
                  <ChevronRight
                    size={16}
                    className={`transform transition-transform ${
                      expandedFolders.has(file.path) ? 'rotate-90' : ''
                    }`}
                  />
                  <Folder size={16} className="text-blue-400" />
                </> 
              ) : (
                <>
                  <span className="w-4" />
                  <FileCode size={16} className="text-gray-400" />
                </>
              )}
              <span className="text-sm">{file.name}</span>
            </button>
            {file.type === 'dir' && expandedFolders.has(file.path) && (
              renderTree(file.path, level + 1)
            )}
          </div>
        ));
    };

    return (
      <div className="bg-[#1a1f2e] rounded-lg p-4">
        <div className="space-y-1">
          {renderTree()}
        </div>
      </div>
    );
  };

  const FileDetails = () => {
    if (!selectedFile) {
      return (
        <div className="bg-[#1a1f2e] rounded-lg p-6 text-center text-gray-400">
          Select a file to view its details
        </div>
      );
    }

    return (
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">File Summary</h2>
          <p className="text-gray-400">
            Here is a brief descriptive overview of the <code className="bg-[#0A0C10] px-2 py-1 rounded">{selectedFile.path}</code> file:
          </p>
          <div className="mt-4 p-4 bg-[#0A0C10] rounded-lg border border-gray-800">
            <p className="text-gray-300">{selectedFile.summary}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">File Content</h3>
          <div className="p-4 bg-[#0A0C10] rounded-lg border border-gray-800 overflow-x-auto">
            <pre className="text-gray-300">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const CodeReferenceContent = () => (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-3">
        <FileExplorer />
      </div>
      <div className="col-span-9">
        <FileDetails />
      </div>
    </div>
  );

  const AnalyticsContent = () => (
    <div className="space-y-8">
      {showBugsView ? (
        <BugsView onBack={() => setShowBugsView(false)} />
      ) : showCodeSmellsView ? (
        <CodeSmellsView onBack={() => setShowCodeSmellsView(false)} />
      ) : showSecurityView ? (
        <SecurityView onBack={() => setShowSecurityView(false)} />
      ) : (
        <>
          {/* Code Quality Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Code Quality</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                onClick={() => setShowBugsView(true)}
                className="bg-[#1a1f2e] p-6 rounded-lg text-left hover:bg-[#1e2436] transition-colors"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Bug className="text-blue-400" size={24} />
                  <h3 className="text-xl font-medium">Bugs</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{mockProject.analytics.codeQuality.bugs}</div>
                    <div className="text-gray-400">Issues</div>
                  </div>
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-8 rounded-full ${
                          i < mockProject.analytics.codeQuality.bugs ? 'bg-red-500' : 'bg-gray-700'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowSecurityView(true)}
                className="bg-[#1a1f2e] p-6 rounded-lg text-left hover:bg-[#1e2436] transition-colors"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="text-red-400" size={24} />
                  <h3 className="text-xl font-medium">Security</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{mockProject.analytics.codeQuality.vulnerabilities}</div>
                    <div className="text-gray-400">Issues</div>
                  </div>
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-8 rounded-full ${
                          i < mockProject.analytics.codeQuality.vulnerabilities ? 'bg-red-500' : 'bg-gray-700'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowCodeSmellsView(true)}
                className="bg-[#1a1f2e] p-6 rounded-lg text-left hover:bg-[#1e2436] transition-colors"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Code className="text-yellow-400" size={24} />
                  <h3 className="text-xl font-medium">Code Smells</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{mockProject.analytics.codeQuality.codeSmells}</div>
                    <div className="text-gray-400">Issues</div>
                  </div>
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-8 rounded-full ${
                          i < mockProject.analytics.codeQuality.codeSmells ? 'bg-yellow-500' : 'bg-gray-700'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </button>

              <div className="bg-[#1a1f2e] p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <Database className="text-blue-400" size={24} />
                  <h3 className="text-xl font-medium">Complexity</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{mockProject.analytics.complexity.maintainability}</div>
                    <div className="text-gray-400">Grade</div>
                  </div>
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-8 rounded-full ${
                          mockProject.analytics.complexity.maintainability === 'A' ? 'bg-green-500' : 'bg-gray-700'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Performance Metrics</h2>
            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Load Time</span>
                    <span className="font-medium">{mockProject.analytics.performance.loadTime}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">First Contentful Paint</span>
                    <span className="font-medium">{mockProject.analytics.performance.firstContentfulPaint}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Time to Interactive</span>
                    <span className="font-medium">{mockProject.analytics.performance.timeToInteractive}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Complexity */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Code Complexity Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1f2e] p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Cognitive Complexity</h3>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{mockProject.analytics.complexity.cognitive}</div>
                  <div className="text-gray-400">Low</div>
                </div>
              </div>
              
              <div className="bg-[#1a1f2e] p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Cyclomatic Complexity</h3>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{mockProject.analytics.complexity.cyclomatic}</div>
                  <div className="text-gray-400">Good</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const ProjectSummaryContent = () => (
    <div className="space-y-8">
      {/* Project Overview */}
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Project Overview</h2>
        <p className="text-gray-300 mb-6">{mockProject.description}</p>
        
        {/* Code Analysis Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0A0C10] p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Star size={20} />
              <span>Overall Rating</span>
            </div>
            <div className="text-2xl font-bold">{mockProject.codeAnalysis.overallScore}/10</div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(mockProject.codeAnalysis.overallScore / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0A0C10] p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <Award size={20} />
              <span>Assessment Score</span>
            </div>
            <div className="text-2xl font-bold">{mockProject.codeAnalysis.assessmentScore}%</div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${mockProject.codeAnalysis.assessmentScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0A0C10] p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-purple-400 mb-2">
              <Target size={20} />
              <span>Code Quality</span>
            </div>
            <div className="text-2xl font-bold">{mockProject.codeAnalysis.codeQuality.score}/10</div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${(mockProject.codeAnalysis.codeQuality.score / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0A0C10] p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-400 mb-2">
              <Zap size={20} />
              <span>Performance</span>
            </div>
            <div className="text-2xl font-bold">{mockProject.codeAnalysis.performance.score}/10</div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(mockProject.codeAnalysis.performance.score / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">Detailed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-purple-400 mb-3">
                <Code size={20} />
                <h4 className="font-medium">Code Quality</h4>
              </div>
              <p className="text-gray-300">{mockProject.codeAnalysis.codeQuality.details}</p>
            </div>
            
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400 mb-3">
                <Shield size={20} />
                <h4 className="font-medium">Security</h4>
              </div>
              <p className="text-gray-300">{mockProject.codeAnalysis.security.details}</p>
            </div>
            
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-400 mb-3">
                <Database size={20} />
                <h4 className="font-medium">Maintainability</h4>
              </div>
              <p className="text-gray-300">{mockProject.codeAnalysis.maintainability.details}</p>
            </div>
            
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-400 mb-3">
                <Zap size={20} />
                <h4 className="font-medium">Performance</h4>
              </div>
              <p className="text-gray-300">{mockProject.codeAnalysis.performance.details}</p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4 mt-8">Technologies</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {mockProject.technologies.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm"
            >
              {tech}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-4">Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockProject.team.map((member) => (
            <div key={member.name} className="bg-[#0A0C10] p-4 rounded-lg flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center">
                <span className="text-blue-400 font-medium">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-gray-400">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <GraduationCap size={32} className="text-white" />
              <div className="text-2xl font-bold">SkillScout</div>
            </div>
            <select className="bg-[#1a1f2e] text-white px-4 py-2 rounded-lg border border-gray-700">
              <option>{mockProject.name}</option>
            </select>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button 
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'summary' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              Project Summary
            </button>
            <button 
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'code' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('code')}
            >
              Code Reference
            </button>
            <button 
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'analytics' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`px-4 py-4 font-medium transition-colors ${
                activeTab === 'assessment' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('assessment')}
            >
              Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'summary' && <ProjectSummaryContent />}
        {activeTab === 'code' && <CodeReferenceContent />}
        {activeTab === 'analytics' && <AnalyticsContent />}
        {activeTab === 'assessment' && <Assessment />}
      </div>
    </div>
  );
}