import { ArrowLeft, Bug, FileCode } from 'lucide-react';
import parse from "html-react-parser";
type Bug = {
  message: string;
  severity: 'MAJOR' | 'CRITICAL' | 'BLOCKER' | 'MINOR' | 'INFO';
  component: string;
  textRange: {
    startLine: number;
    endLine: number;
  };
  code_snippet: string;
  root_cause: string;
};

type BugsViewProps = {
  onBack: () => void;
  bugs: Bug[];
};

export default function BugsView({ onBack, bugs }: BugsViewProps) {
  const getSeverityColor = (severity: Bug['severity']) => {
    switch (severity) {
      case 'MAJOR':
      case 'CRITICAL':
      case 'BLOCKER':
        return 'text-red-500';
      case 'MINOR':
        return 'text-yellow-500';
      case 'INFO':
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
          <Bug size={24} className="text-red-400" />
          <h2 className="text-2xl font-semibold">Project Bugs</h2>
        </div>
      </div>

      <div className="space-y-6">
        {bugs.map((bug,index) => (
          <div key={index} className="bg-[#1a1f2e] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-gray-400">{index}</span>
                  <h3 className="text-xl font-medium">{bug.message}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center space-x-1 ${getSeverityColor(bug.severity)}`}>
                    <Bug size={16} />
                    <span className="capitalize">{bug.severity} Severity</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Root Cause Section */}
                        {(bug.severity == 'CRITICAL' || bug.severity == 'MAJOR' || bug.severity == 'BLOCKER' ) && bug.root_cause && (
                          <div className="mb-4 p-4 bg-[#0A0C10] rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Root Cause:</h4>
                            <div className="text-gray-300 prose prose-invert">
                              {parse(bug.root_cause)}
                            </div>
                          </div>
                        )}

            <div className="bg-[#0A0C10] rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <FileCode size={16} />
                <span>{bug.component}</span>
                <span>Line {bug.textRange.startLine}</span>
              </div>
              <pre className="text-sm overflow-x-auto">
              <code className="block p-4 text-red-400">
                  {bug.code_snippet}
                </code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}