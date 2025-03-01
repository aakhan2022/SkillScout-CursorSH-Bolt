import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Brain, Award, Clock, Target, BarChart2 } from 'lucide-react';

type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number | null;
  explanation: string;
  timeSpent: number; // in seconds
};

type QuizResult = {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  completedAt: string;
  timeSpent: number; // in seconds
  skillsAssessed: {
    name: string;
    score: number;
  }[];
};

// Mock questions for candidate's assessment
const mockQuestions: Question[] = [
  {
    id: 1,
    text: "Which hook would you use to manage the state of the currently selected file in the file explorer?",
    options: [
      "useEffect",
      "useState",
      "useContext",
      "useReducer"
    ],
    correctAnswer: 1,
    selectedAnswer: null,
    explanation: "useState is the correct choice as we need to manage a simple state value that represents the currently selected file.",
    timeSpent: 0
  },
  {
    id: 2,
    text: "In the project's database schema, what type of relationship exists between the profiles and projects tables?",
    options: [
      "Many-to-Many",
      "One-to-One",
      "One-to-Many",
      "No relationship"
    ],
    correctAnswer: 2,
    selectedAnswer: null,
    explanation: "The projects table has a user_id foreign key referencing the profiles table, creating a One-to-Many relationship where one profile can have many projects.",
    timeSpent: 0
  },
  {
    id: 3,
    text: "Which Tailwind CSS class combination would you use to create a flex container with centered items both horizontally and vertically?",
    options: [
      "flex items-center justify-center",
      "grid place-items-center",
      "flex align-middle justify-middle",
      "flex-center items-middle"
    ],
    correctAnswer: 0,
    selectedAnswer: null,
    explanation: "The combination of 'flex items-center justify-center' is the correct way to center items both horizontally and vertically in Tailwind CSS.",
    timeSpent: 0
  },
  {
    id: 4,
    text: "What is the purpose of Row Level Security (RLS) in the project's database design?",
    options: [
      "To encrypt the database tables",
      "To prevent unauthorized access to specific rows based on user identity",
      "To improve query performance",
      "To validate data before insertion"
    ],
    correctAnswer: 1,
    selectedAnswer: null,
    explanation: "RLS is used to ensure users can only access their own data by adding security policies at the row level based on user identity.",
    timeSpent: 0
  },
  {
    id: 5,
    text: "Which React pattern is used in the project to conditionally render different content based on the active tab?",
    options: [
      "Higher Order Components",
      "Render Props",
      "Conditional Rendering with ternary operators",
      "Context API"
    ],
    correctAnswer: 2,
    selectedAnswer: null,
    explanation: "The project uses conditional rendering with ternary operators to switch between different content components based on the activeTab state.",
    timeSpent: 0
  }
];

// Mock attempted assessment data for employer view
const attemptedQuestions: Question[] = [
  {
    id: 1,
    text: "Which hook would you use to manage the state of the currently selected file in the file explorer?",
    options: [
      "useEffect",
      "useState",
      "useContext",
      "useReducer"
    ],
    correctAnswer: 1,
    selectedAnswer: 1,
    explanation: "useState is the correct choice as we need to manage a simple state value that represents the currently selected file.",
    timeSpent: 45
  },
  {
    id: 2,
    text: "In the project's database schema, what type of relationship exists between the profiles and projects tables?",
    options: [
      "Many-to-Many",
      "One-to-One",
      "One-to-Many",
      "No relationship"
    ],
    correctAnswer: 2,
    selectedAnswer: 2,
    explanation: "The projects table has a user_id foreign key referencing the profiles table, creating a One-to-Many relationship where one profile can have many projects.",
    timeSpent: 60
  },
  {
    id: 3,
    text: "Which Tailwind CSS class combination would you use to create a flex container with centered items both horizontally and vertically?",
    options: [
      "flex items-center justify-center",
      "grid place-items-center",
      "flex align-middle justify-middle",
      "flex-center items-middle"
    ],
    correctAnswer: 0,
    selectedAnswer: 1,
    explanation: "The combination of 'flex items-center justify-center' is the correct way to center items both horizontally and vertically in Tailwind CSS.",
    timeSpent: 30
  },
  {
    id: 4,
    text: "What is the purpose of Row Level Security (RLS) in the project's database design?",
    options: [
      "To encrypt the database tables",
      "To prevent unauthorized access to specific rows based on user identity",
      "To improve query performance",
      "To validate data before insertion"
    ],
    correctAnswer: 1,
    selectedAnswer: 1,
    explanation: "RLS is used to ensure users can only access their own data by adding security policies at the row level based on user identity.",
    timeSpent: 55
  },
  {
    id: 5,
    text: "Which React pattern is used in the project to conditionally render different content based on the active tab?",
    options: [
      "Higher Order Components",
      "Render Props",
      "Conditional Rendering with ternary operators",
      "Context API"
    ],
    correctAnswer: 2,
    selectedAnswer: 2,
    explanation: "The project uses conditional rendering with ternary operators to switch between different content components based on the activeTab state.",
    timeSpent: 40
  }
];

const mockResults: QuizResult = {
  totalQuestions: 5,
  correctAnswers: 4,
  incorrectAnswers: 1,
  score: 80,
  completedAt: "2024-03-15T14:30:00Z",
  timeSpent: 230,
  skillsAssessed: [
    { name: "React Fundamentals", score: 90 },
    { name: "Database Design", score: 85 },
    { name: "UI/UX", score: 75 },
    { name: "Security", score: 85 },
    { name: "State Management", score: 80 }
  ]
};

export default function Assessment() {
  const userRole = localStorage.getItem('user_role');
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [results, setResults] = useState<QuizResult>({
    totalQuestions: mockQuestions.length,
    correctAnswers: 0,
    incorrectAnswers: 0,
    score: 0,
    completedAt: new Date().toISOString(),
    timeSpent: 0,
    skillsAssessed: []
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answerIndex);
      setShowExplanation(true);

      if (answerIndex === mockQuestions[currentQuestion].correctAnswer) {
        setResults(prev => ({
          ...prev,
          correctAnswers: prev.correctAnswers + 1,
          score: ((prev.correctAnswers + 1) / prev.totalQuestions) * 100
        }));
      } else {
        setResults(prev => ({
          ...prev,
          incorrectAnswers: prev.incorrectAnswers + 1,
          score: (prev.correctAnswers / prev.totalQuestions) * 100
        }));
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  // Employer View
  if (userRole === 'employer') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Assessment Summary */}
        <div className="bg-[#1a1f2e] rounded-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Award className="w-12 h-12 text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold">Assessment Results</h2>
                <p className="text-gray-400">Completed on {formatDate(mockResults.completedAt)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-400">{mockResults.score}%</div>
              <div className="text-sm text-gray-400">Overall Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#0A0C10] p-6 rounded-lg">
              <div className="flex items-center space-x-3 text-green-400 mb-2">
                <CheckCircle2 size={20} />
                <span>Correct Answers</span>
              </div>
              <div className="text-2xl font-bold">{mockResults.correctAnswers}</div>
              <div className="text-sm text-gray-400">out of {mockResults.totalQuestions} questions</div>
            </div>

            <div className="bg-[#0A0C10] p-6 rounded-lg">
              <div className="flex items-center space-x-3 text-red-400 mb-2">
                <XCircle size={20} />
                <span>Incorrect Answers</span>
              </div>
              <div className="text-2xl font-bold">{mockResults.incorrectAnswers}</div>
              <div className="text-sm text-gray-400">Questions missed</div>
            </div>

            <div className="bg-[#0A0C10] p-6 rounded-lg">
              <div className="flex items-center space-x-3 text-yellow-400 mb-2">
                <Clock size={20} />
                <span>Time Spent</span>
              </div>
              <div className="text-2xl font-bold">{formatTime(mockResults.timeSpent)}</div>
              <div className="text-sm text-gray-400">Total duration</div>
            </div>
          </div>

          {/* Skills Assessment */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Target className="text-purple-400" size={24} />
              <h3 className="text-xl font-semibold">Skills Assessment</h3>
            </div>
            <div className="space-y-4">
              {mockResults.skillsAssessed.map((skill) => (
                <div key={skill.name} className="bg-[#0A0C10] p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-sm text-gray-400">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <BarChart2 className="text-blue-400" size={24} />
            <h3 className="text-xl font-semibold">Detailed Review</h3>
          </div>

          {attemptedQuestions.map((question, index) => (
            <div key={question.id} className="bg-[#1a1f2e] rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-2">Question {index + 1}</div>
                  <p className="text-lg mb-4">{question.text}</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <div className="text-sm text-gray-400">
                    <Clock size={14} className="inline mr-1" />
                    {formatTime(question.timeSpent)}
                  </div>
                  {question.selectedAnswer === question.correctAnswer ? (
                    <CheckCircle2 className="text-green-400" size={24} />
                  ) : (
                    <XCircle className="text-red-400" size={24} />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`p-4 rounded-lg ${
                      optionIndex === question.correctAnswer
                        ? 'bg-green-900/20 border border-green-500'
                        : optionIndex === question.selectedAnswer
                        ? 'bg-red-900/20 border border-red-500'
                        : 'bg-[#0A0C10]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {optionIndex === question.correctAnswer ? (
                        <CheckCircle2 className="text-green-500" size={20} />
                      ) : optionIndex === question.selectedAnswer ? (
                        <XCircle className="text-red-500" size={20} />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Explanation</h4>
                <p className="text-gray-300">{question.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Candidate View
  if (quizCompleted) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1a1f2e] rounded-lg p-8 text-center">
          <Award className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-400">{results.correctAnswers}</div>
              <div className="text-sm text-gray-400">Correct Answers</div>
            </div>
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="text-3xl font-bold text-red-400">{results.incorrectAnswers}</div>
              <div className="text-sm text-gray-400">Incorrect Answers</div>
            </div>
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-400">{Math.round(results.score)}%</div>
              <div className="text-sm text-gray-400">Final Score</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress */}
      <div className="bg-[#1a1f2e] rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Question {currentQuestion + 1} of {mockQuestions.length}</span>
          <span className="text-sm text-gray-400">Score: {Math.round(results.score)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="text-blue-400" size={24} />
          <h3 className="text-xl font-medium">Technical Assessment</h3>
        </div>
        
        <p className="text-lg mb-6">{mockQuestions[currentQuestion].text}</p>

        <div className="space-y-3">
          {mockQuestions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
              className={`w-full p-4 rounded-lg text-left transition-colors ${
                selectedAnswer === null
                  ? 'bg-[#0A0C10] hover:bg-gray-800'
                  : selectedAnswer === index
                    ? index === mockQuestions[currentQuestion].correctAnswer
                      ? 'bg-green-900/20 border border-green-500'
                      : 'bg-red-900/20 border border-red-500'
                    : index === mockQuestions[currentQuestion].correctAnswer
                      ? 'bg-green-900/20 border border-green-500'
                      : 'bg-[#0A0C10]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selectedAnswer !== null && (
                  index === mockQuestions[currentQuestion].correctAnswer ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : selectedAnswer === index ? (
                    <XCircle className="text-red-500" size={20} />
                  ) : (
                    <HelpCircle className="text-gray-500" size={20} />
                  )
                )}
              </div>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
            <p className="text-gray-300">{mockQuestions[currentQuestion].explanation}</p>
          </div>
        )}

        {selectedAnswer !== null && (
          <button
            onClick={handleNextQuestion}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {currentQuestion < mockQuestions.length - 1 ? 'Next Question' : 'Complete Assessment'}
          </button>
        )}
      </div>
    </div>
  );
}