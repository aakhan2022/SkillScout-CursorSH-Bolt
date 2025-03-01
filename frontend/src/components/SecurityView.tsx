import React from 'react';
import { ArrowLeft, Shield, FileCode, AlertTriangle, AlertOctagon, AlertCircle } from 'lucide-react';

type SecurityVulnerability = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  status: 'open' | 'in-progress' | 'resolved';
  file: string;
  lineNumber: number;
  description: string;
  impact: string;
  remediation: string;
  codeSnippet: string;
};

const mockVulnerabilities: SecurityVulnerability[] = [
  {
    id: 'SEC-001',
    title: 'Insecure Direct Object Reference (IDOR)',
    severity: 'critical',
    status: 'open',
    file: 'src/api/projectApi.ts',
    lineNumber: 45,
    description: 'The API endpoint does not properly validate user access to project resources, allowing potential unauthorized access to other users\' projects.',
    impact: 'Attackers could potentially access, modify, or delete projects belonging to other users by manipulating the project ID parameter.',
    remediation: 'Implement proper authorization checks using Row Level Security (RLS) and validate user ownership of resources before processing requests.',
    codeSnippet: `async function getProject(projectId: string) {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  // Missing user ownership validation
  return data;
}`
  },
  {
    id: 'SEC-002',
    title: 'Unhandled Promise Rejection',
    severity: 'high',
    status: 'in-progress',
    file: 'src/components/Dashboard.tsx',
    lineNumber: 123,
    description: 'Promise rejections are not properly handled, potentially exposing sensitive error information and causing application crashes.',
    impact: 'Application stability could be compromised, and sensitive error details might be exposed to users.',
    remediation: 'Implement proper error handling with try-catch blocks and display user-friendly error messages.',
    codeSnippet: `const fetchProjects = async () => {
  const response = await supabase
    .from('projects')
    .select('*');
  setProjects(response.data);
  // Missing error handling
};`
  },
  {
    id: 'SEC-003',
    title: 'Exposed Environment Variables',
    severity: 'moderate',
    status: 'open',
    file: 'src/config/supabase.ts',
    lineNumber: 12,
    description: 'Environment variables are directly exposed in the client-side code without proper access control.',
    impact: 'Sensitive configuration values could be exposed to users through the browser.',
    remediation: 'Use environment variables with proper VITE_ prefix and implement server-side environment variable handling.',
    codeSnippet: `// Direct exposure of environment variables
export const supabaseUrl = import.meta.env.SUPABASE_URL;
export const supabaseKey = import.meta.env.SUPABASE_KEY;`
  }
];

type SecurityViewProps = {
  onBack: () => void;
};

export default function SecurityView({ onBack }: SecurityViewProps) {
  const getSeverityIcon = (severity: SecurityVulnerability['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon size={16} />;
      case 'high':
        return <AlertTriangle size={16} />;
      case 'moderate':
      case 'low':
        return <AlertCircle size={16} />;
    }
  };

  const getSeverityColor = (severity: SecurityVulnerability['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'moderate':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Analytics</span>
        </button>
        <div className="flex items-center space-x-2">
          <Shield size={24} className="text-red-400" />
          <h2 className="text-2xl font-semibold">Security Vulnerabilities</h2>
        </div>
      </div>

      <div className="space-y-6">
        {mockVulnerabilities.map((vulnerability) => (
          <div key={vulnerability.id} className="bg-[#1a1f2e] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-gray-400">{vulnerability.id}</span>
                  <h3 className="text-xl font-medium">{vulnerability.title}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center space-x-1 ${getSeverityColor(vulnerability.severity)}`}>
                    {getSeverityIcon(vulnerability.severity)}
                    <span className="capitalize">{vulnerability.severity} Severity</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-300 mb-4">{vulnerability.description}</p>

            <div className="bg-[#0A0C10] rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <FileCode size={16} />
                <span>{vulnerability.file}</span>
                <span>Line {vulnerability.lineNumber}</span>
              </div>
              <pre className="text-sm overflow-x-auto">
                <code className="text-gray-300">{vulnerability.codeSnippet}</code>
              </pre>
            </div>

            <div className="space-y-4">
              <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">Impact</h4>
                <p className="text-gray-300">{vulnerability.impact}</p>
              </div>

              <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">Remediation</h4>
                <p className="text-gray-300">{vulnerability.remediation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}