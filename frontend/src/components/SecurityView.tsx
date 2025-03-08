import React from 'react';
import { ArrowLeft, Shield, FileCode, AlertTriangle, AlertCircle } from 'lucide-react';
import parse from "html-react-parser";


type Vulnerability = {
  message: string;
  severity:  'HIGH' | 'LOW';
  component: string;
  line: number;
  riskDescription: string;
  code_snippet: string;
};

type SecurityViewProps = {
  onBack: () => void;
  vulnerabilities: Vulnerability[];
};

export default function SecurityView({ onBack, vulnerabilities }: SecurityViewProps) {
  const getSeverityIcon = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle size={16} />;
      case 'LOW':
        return <AlertCircle size={16} />;
    }
  };

  const getSeverityColor = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'HIGH':
        return 'text-orange-500';
      case 'LOW':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // Helper function to clean HTML content
  const cleanDescription = (message: string) => {
    // Remove HTML tags but preserve line breaks
    return message
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '')
      .replace(/<li>/g, '• ')
      .replace(/<\/li>/g, '\n')
      .replace(/<a[^>]*>/g, '')
      .replace(/<\/a>/g, '')
      .trim();
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
        {vulnerabilities.map((vulnerability, index) => (
          <div key={index} className="bg-[#1a1f2e] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-gray-400">{index+1}</span>
                  <h3 className="text-xl font-medium">{cleanDescription(vulnerability.message)}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center space-x-1 ${getSeverityColor(vulnerability.severity)}`}>
                    {getSeverityIcon(vulnerability.severity)}
                    <span className="capitalize">{vulnerability.severity} Severity</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-gray-300 mb-4">
              {parse(vulnerability.riskDescription)}
            </div>

            <div className="bg-[#0A0C10] rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <FileCode size={16} />
                <span>{vulnerability.component}</span>
                <span>Line {vulnerability.line}</span>
              </div>
              <pre className="text-sm overflow-x-auto">
                <code className="text-gray-300">{vulnerability.code_snippet}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}