import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, HelpCircle, Brain, Award } from 'lucide-react';
import { assessmentService } from '../services/assessment';
import type { Assessment as AssessmentType } from '../services/assessment';

export default function Assessment() {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    const fetchOrGenerateAssessment = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        // Try to get existing assessment first
        try {
          const existingAssessment = await assessmentService.getAssessment(projectId);
          setAssessment(existingAssessment);
          
          // If assessment is completed, set all answers
          if (existingAssessment.completed_at && existingAssessment.answers) {
            setAnswers(existingAssessment.answers);
          }
          return;
        } catch (err) {
          // If no assessment exists, generate new one
          const newAssessment = await assessmentService.generateAssessment(projectId);
          setAssessment(newAssessment);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchOrGenerateAssessment();
  }, [projectId]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer === null && assessment && !assessment.completed_at) {
      setSelectedAnswer(answerIndex);
      setShowExplanation(true);
      setAnswers(prev => [...prev, answerIndex]);
    }
  };

  const handleNextQuestion = async () => {
    if (!assessment) return;

    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Submit assessment
      try {
        setSubmitting(true);
        setError(null);
        
        // Calculate time spent
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        
        // Submit assessment
        await assessmentService.submitAssessment(
          assessment.id,
          answers,
          timeSpent
        );
        
        // Refresh assessment to get updated results
        const updatedAssessment = await assessmentService.getAssessment(projectId!);
        setAssessment(updatedAssessment);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to submit assessment');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1a1f2e] rounded-lg p-6 text-center text-gray-400">
          No assessment available
        </div>
      </div>
    );
  }

  // Show results if assessment is completed
  if (assessment.completed_at) {
    const correctAnswers = assessment.questions.reduce((count, q, i) => 
      count + (assessment.answers?.[i] === q.correct_answer ? 1 : 0), 0);
    const incorrectAnswers = assessment.questions.length - correctAnswers;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1a1f2e] rounded-lg p-8 text-center">
          <Award className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-400">{correctAnswers}</div>
              <div className="text-sm text-gray-400">Correct Answers</div>
            </div>
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="text-3xl font-bold text-red-400">{incorrectAnswers}</div>
              <div className="text-sm text-gray-400">Incorrect Answers</div>
            </div>
            <div className="bg-[#0A0C10] p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-400">{assessment.score}%</div>
              <div className="text-sm text-gray-400">Final Score</div>
            </div>
          </div>

          {/* Show detailed review */}
          <div className="space-y-6 text-left">
            {assessment.questions.map((question, index) => (
              <div key={index} className="bg-[#0A0C10] rounded-lg p-6">
                <p className="text-lg mb-4">{question.text}</p>
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-4 rounded-lg ${
                        optionIndex === question.correct_answer
                          ? 'bg-green-900/20 border border-green-500'
                          : optionIndex === assessment.answers?.[index]
                          ? 'bg-red-900/20 border border-red-500'
                          : 'bg-[#1a1f2e]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {optionIndex === question.correct_answer && (
                          <CheckCircle2 className="text-green-500" size={20} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
                  <p className="text-gray-300">{question.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show assessment questions
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress */}
      <div className="bg-[#1a1f2e] rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">
            Question {currentQuestion + 1} of {assessment.questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="text-blue-400" size={24} />
          <h3 className="text-xl font-medium">Technical Assessment</h3>
        </div>
        
        <p className="text-lg mb-6">{assessment.questions[currentQuestion].text}</p>

        <div className="space-y-3">
          {assessment.questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
              className={`w-full p-4 rounded-lg text-left transition-colors ${
                selectedAnswer === null
                  ? 'bg-[#0A0C10] hover:bg-gray-800'
                  : selectedAnswer === index
                    ? index === assessment.questions[currentQuestion].correct_answer
                      ? 'bg-green-900/20 border border-green-500'
                      : 'bg-red-900/20 border border-red-500'
                    : index === assessment.questions[currentQuestion].correct_answer
                      ? 'bg-green-900/20 border border-green-500'
                      : 'bg-[#0A0C10]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selectedAnswer !== null && (
                  index === assessment.questions[currentQuestion].correct_answer ? (
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
            <p className="text-gray-300">
              {assessment.questions[currentQuestion].explanation}
            </p>
          </div>
        )}

        {selectedAnswer !== null && (
          <button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : currentQuestion < assessment.questions.length - 1 ? (
              'Next Question'
            ) : (
              'Complete Assessment'
            )}
          </button>
        )}
      </div>
    </div>
  );
}