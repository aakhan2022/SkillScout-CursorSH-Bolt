import React from 'react';
import { ArrowLeft, Code, FileCode } from 'lucide-react';

type CodeSmell = {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  file: string;
  lineNumber: number;
  description: string;
  codeSnippet: string;
  recommendation: string;
};

const mockCodeSmells: CodeSmell[] = [
  {
    id: 'CS-001',
    title: 'Duplicate code in component rendering',
    impact: 'medium',
    status: 'active',
    file: 'src/components/Dashboard.tsx',
    lineNumber: 78,
    description: 'Similar code structure repeated multiple times in the render method. This makes the code harder to maintain and increases the chance of bugs when making changes.',
    codeSnippet: `<div className="bg-gray-800 rounded-lg p-4">
  <div className="flex items-center space-x-2">
    <Icon size={20} />
    <span>{title}</span>
  </div>
  <div className="mt-2">{content}</div>
</div>

// Similar structure repeated multiple times
<div className="bg-gray-800 rounded-lg p-4">
  <div className="flex items-center space-x-2">
    <OtherIcon size={20} />
    <span>{otherTitle}</span>
  </div>
  <div className="mt-2">{otherContent}</div>
</div>`,
    recommendation: 'Extract the repeated structure into a reusable component to improve maintainability and reduce code duplication.'
  },
  {
    id: 'CS-002',
    title: 'Complex conditional rendering',
    impact: 'high',
    status: 'active',
    file: 'src/components/ProjectDetails.tsx',
    lineNumber: 156,
    description: 'Multiple nested ternary operators make the code difficult to read and maintain.',
    codeSnippet: `className={
  selectedAnswer === null
    ? 'bg-[#0A0C10] hover:bg-gray-800'
    : selectedAnswer === index
      ? index === mockQuestions[currentQuestion].correctAnswer
        ? 'bg-green-900/20 border border-green-500'
        : 'bg-red-900/20 border border-red-500'
      : index === mockQuestions[currentQuestion].correctAnswer
        ? 'bg-green-900/20 border border-green-500'
        : 'bg-[#0A0C10]'
}`,
    recommendation: 'Break down complex conditional logic into smaller, more manageable functions or use a switch statement for better readability.'
  },
  {
    id: 'CS-003',
    title: 'Large component with multiple responsibilities',
    impact: 'medium',
    status: 'active',
    file: 'src/components/Assessment.tsx',
    lineNumber: 1,
    description: 'Component handles too many responsibilities including state management, rendering, and business logic. This makes it harder to test and maintain.',
    codeSnippet: `export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState({
    totalQuestions: questions.length,
    correctAnswers: 0,
    incorrectAnswers: 0,
    score: 0
  });

  // Multiple event handlers and complex logic
  const handleAnswerSelect = (answerIndex) => {
    // Complex logic here
  };

  const handleNextQuestion = () => {
    // More complex logic here
  };

  // Large render method with multiple sections
  return (
    // Many nested components and conditional rendering
  );
}`,
    recommendation: 'Split the component into smaller, more focused components. Extract business logic into custom hooks and separate the state management concerns.'
  },
  {
    id: 'CS-004',
    title: 'Inline styles in JSX',
    impact: 'low',
    status: 'active',
    file: 'src/components/FileExplorer.tsx',
    lineNumber: 34,
    description: 'Using inline styles makes it harder to maintain consistent styling across the application.',
    codeSnippet: `<div 
  style={{ 
    marginLeft: '20px',
    padding: '10px',
    backgroundColor: '#1a1f2e',
    borderRadius: '8px'
  }}
>
  {content}
</div>`,
    recommendation: 'Use Tailwind CSS classes or extract common styles into reusable classes to maintain consistency and improve maintainability.'
  },
  {
    id: 'CS-005',
    title: 'Magic numbers in calculations',
    impact: 'low',
    status: 'active',
    file: 'src/utils/analytics.ts',
    lineNumber: 89,
    description: 'Using magic numbers makes code harder to understand and maintain.',
    codeSnippet: `const calculateComplexity = (lines: number) => {
  // Magic numbers 100 and 0.5 with unclear meaning
  return Math.round(lines * 0.5 + 100);
};`,
    recommendation: 'Extract magic numbers into named constants with clear meanings to improve code readability and maintainability.'
  }
];

type CodeSmellsViewProps = {
  onBack: () => void;
};

export default function CodeSmellsView({ onBack }: CodeSmellsViewProps) {
  const getImpactColor = (impact: CodeSmell['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-red-500';
      case 'medium':
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
          <Code size={24} className="text-yellow-400" />
          <h2 className="text-2xl font-semibold">Code Smells</h2>
        </div>
      </div>

      <div className="space-y-6">
        {mockCodeSmells.map((smell) => (
          <div key={smell.id} className="bg-[#1a1f2e] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-gray-400">{smell.id}</span>
                  <h3 className="text-xl font-medium">{smell.title}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center space-x-1 ${getImpactColor(smell.impact)}`}>
                    <Code size={16} />
                    <span className="capitalize">{smell.impact} Impact</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-300 mb-4">{smell.description}</p>

            <div className="bg-[#0A0C10] rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <FileCode size={16} />
                <span>{smell.file}</span>
                <span>Line {smell.lineNumber}</span>
              </div>
              <pre className="text-sm overflow-x-auto">
                <code className="text-gray-300">{smell.codeSnippet}</code>
              </pre>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Recommendation</h4>
              <p className="text-gray-300">{smell.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}