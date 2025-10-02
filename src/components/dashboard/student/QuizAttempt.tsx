import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { ClockIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, ArrowLeftIcon, ArrowRightIcon, FlagIcon, HelpCircleIcon } from 'lucide-react';
interface QuizQuestion {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'matching' | 'short_answer' | 'essay';
  options: any;
  correct_answer: any;
  explanation: string;
  points: number;
  difficulty: string;
  order_index: number;
}
interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions: string;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number | null;
  randomize_questions: boolean;
  show_answers: boolean;
}
export const QuizAttempt: React.FC = () => {
  const {
    quizId
  } = useParams<{
    quizId: string;
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        if (!quizId) return;
        // Get current user
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }
        setUserId(user.id);
        // Check if user has any existing attempts
        const {
          data: existingAttempts,
          error: attemptsError
        } = await supabase.from('quiz_attempts').select('id, answers, score, percentage, passed, completed_at').eq('user_id', user.id).eq('quiz_id', quizId).order('started_at', {
          ascending: false
        }).limit(1);
        if (attemptsError) throw attemptsError;
        // If there's a completed attempt, show the results
        if (existingAttempts && existingAttempts.length > 0 && existingAttempts[0].completed_at) {
          setQuizComplete(true);
          setScore(existingAttempts[0].score);
          setPercentage(existingAttempts[0].percentage);
          setPassed(existingAttempts[0].passed);
          setAnswers(existingAttempts[0].answers || {});
        }
        // Fetch quiz details
        const {
          data: quizData,
          error: quizError
        } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
        if (quizError) throw quizError;
        setQuiz(quizData);
        // Fetch quiz questions
        const {
          data: questionData,
          error: questionError
        } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index', {
          ascending: true
        });
        if (questionError) throw questionError;
        // Randomize questions if needed
        let processedQuestions = questionData || [];
        if (quizData.randomize_questions) {
          processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
        }
        setQuestions(processedQuestions);
        // Set timer if applicable
        if (quizData.time_limit_minutes && !quizComplete) {
          const timeInSeconds = quizData.time_limit_minutes * 60;
          setTimeRemaining(timeInSeconds);
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId, navigate]);
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining > 0 && !quizComplete) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, quizComplete]);
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  const submitQuiz = async () => {
    if (!quiz || !userId || submitting) return;
    try {
      setSubmitting(true);
      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;
      questions.forEach(question => {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        if (!userAnswer) return;
        if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
          if (userAnswer === question.correct_answer) {
            earnedPoints += question.points;
          }
        } else if (question.question_type === 'matching') {
          // For matching questions, calculate partial credit
          const correctMatches = Object.entries(userAnswer).filter(([key, value]) => question.correct_answer[key] === value).length;
          const totalMatches = Object.keys(question.correct_answer).length;
          earnedPoints += correctMatches / totalMatches * question.points;
        }
        // Short answer and essay would need manual grading
      });
      const scorePercentage = Math.round(earnedPoints / totalPoints * 100);
      const hasPassed = scorePercentage >= quiz.passing_score;
      // Save attempt to database
      const {
        data: attemptData,
        error: attemptError
      } = await supabase.from('quiz_attempts').insert({
        user_id: userId,
        quiz_id: quizId,
        score: scorePercentage,
        percentage: scorePercentage,
        passed: hasPassed,
        answers,
        time_spent_seconds: quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 - (timeRemaining || 0) : null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }).select();
      if (attemptError) throw attemptError;
      // Update state with results
      setQuizComplete(true);
      setScore(scorePercentage);
      setPercentage(scorePercentage);
      setPassed(hasPassed);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };
  const renderQuestion = () => {
    if (questions.length === 0) return null;
    const question = questions[currentQuestionIndex];
    if (!question) return null;
    switch (question.question_type) {
      case 'multiple_choice':
        return renderMultipleChoice(question);
      case 'true_false':
        return renderTrueFalse(question);
      case 'matching':
        return renderMatching(question);
      case 'short_answer':
        return renderShortAnswer(question);
      case 'essay':
        return renderEssay(question);
      default:
        return <p>Unsupported question type</p>;
    }
  };
  const renderMultipleChoice = (question: QuizQuestion) => {
    const options = Array.isArray(question.options) ? question.options : [];
    const userAnswer = answers[question.id];
    const isCorrect = quizComplete && userAnswer === question.correct_answer;
    const isIncorrect = quizComplete && userAnswer !== question.correct_answer;
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question}
          </h3>
          {quizComplete && <div className={`mt-2 p-2 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {isCorrect ? <div className="flex items-center">
                  <CheckCircleIcon size={16} className="mr-2" />
                  <span>Correct!</span>
                </div> : <div>
                  <div className="flex items-center">
                    <XCircleIcon size={16} className="mr-2" />
                    <span>Incorrect</span>
                  </div>
                  {quiz?.show_answers && <div className="mt-1 text-sm">
                      Correct answer:{' '}
                      {options.find(opt => opt.value === question.correct_answer)?.label || question.correct_answer}
                    </div>}
                </div>}
              {question.explanation && quiz?.show_answers && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div className="space-y-2">
          {options.map((option, index) => <div key={index} className="flex items-center">
              <input type="radio" id={`${question.id}-option-${index}`} name={`question-${question.id}`} value={option.value} checked={userAnswer === option.value} onChange={() => handleAnswerChange(question.id, option.value)} disabled={quizComplete} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
              <label htmlFor={`${question.id}-option-${index}`} className={`ml-2 block text-gray-700 ${quizComplete && option.value === question.correct_answer ? 'font-bold text-green-700' : ''}`}>
                {option.label}
              </label>
              {quizComplete && option.value === question.correct_answer && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
            </div>)}
        </div>
      </div>;
  };
  const renderTrueFalse = (question: QuizQuestion) => {
    const userAnswer = answers[question.id];
    const isCorrect = quizComplete && userAnswer === question.correct_answer;
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question}
          </h3>
          {quizComplete && <div className={`mt-2 p-2 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {isCorrect ? <div className="flex items-center">
                  <CheckCircleIcon size={16} className="mr-2" />
                  <span>Correct!</span>
                </div> : <div>
                  <div className="flex items-center">
                    <XCircleIcon size={16} className="mr-2" />
                    <span>Incorrect</span>
                  </div>
                  {quiz?.show_answers && <div className="mt-1 text-sm">
                      Correct answer:{' '}
                      {question.correct_answer ? 'True' : 'False'}
                    </div>}
                </div>}
              {question.explanation && quiz?.show_answers && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <input type="radio" id={`${question.id}-true`} name={`question-${question.id}`} value="true" checked={userAnswer === true} onChange={() => handleAnswerChange(question.id, true)} disabled={quizComplete} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
            <label htmlFor={`${question.id}-true`} className={`ml-2 block text-gray-700 ${quizComplete && question.correct_answer === true ? 'font-bold text-green-700' : ''}`}>
              True
            </label>
            {quizComplete && question.correct_answer === true && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
          </div>
          <div className="flex items-center">
            <input type="radio" id={`${question.id}-false`} name={`question-${question.id}`} value="false" checked={userAnswer === false} onChange={() => handleAnswerChange(question.id, false)} disabled={quizComplete} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
            <label htmlFor={`${question.id}-false`} className={`ml-2 block text-gray-700 ${quizComplete && question.correct_answer === false ? 'font-bold text-green-700' : ''}`}>
              False
            </label>
            {quizComplete && question.correct_answer === false && <CheckCircleIcon size={16} className="ml-2 text-green-600" />}
          </div>
        </div>
      </div>;
  };
  const renderMatching = (question: QuizQuestion) => {
    // This is a simplified version of matching - in a real app, you'd want drag and drop
    const leftItems = question.options?.left || [];
    const rightItems = question.options?.right || [];
    const userAnswer = answers[question.id] || {};
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question}
          </h3>
          {quizComplete && quiz?.show_answers && question.explanation && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
              <strong>Explanation:</strong> {question.explanation}
            </div>}
        </div>
        <div className="space-y-4">
          {leftItems.map((item: any, index: number) => {
          const isCorrect = quizComplete && userAnswer[item.id] === question.correct_answer[item.id];
          return <div key={index} className="flex items-center">
                <div className="w-1/2 pr-4">
                  <div className="p-2 bg-gray-50 rounded-lg">{item.text}</div>
                </div>
                <div className="w-1/2">
                  <select value={userAnswer[item.id] || ''} onChange={e => {
                const newAnswer = {
                  ...userAnswer,
                  [item.id]: e.target.value
                };
                handleAnswerChange(question.id, newAnswer);
              }} disabled={quizComplete} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">-- Select Match --</option>
                    {rightItems.map((rightItem: any, rightIndex: number) => <option key={rightIndex} value={rightItem.id}>
                        {rightItem.text}
                      </option>)}
                  </select>
                </div>
                {quizComplete && <div className="ml-2">
                    {isCorrect ? <CheckCircleIcon size={16} className="text-green-600" /> : <XCircleIcon size={16} className="text-red-600" />}
                  </div>}
              </div>;
        })}
        </div>
        {quizComplete && quiz?.show_answers && <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800">
            <h4 className="font-medium mb-2">Correct Matches:</h4>
            <ul className="space-y-1">
              {Object.entries(question.correct_answer).map(([leftId, rightId], index) => {
            const leftItem = leftItems.find((item: any) => item.id === leftId);
            const rightItem = rightItems.find((item: any) => item.id === rightId);
            return <li key={index}>
                      <strong>{leftItem?.text}</strong> → {rightItem?.text}
                    </li>;
          })}
            </ul>
          </div>}
      </div>;
  };
  const renderShortAnswer = (question: QuizQuestion) => {
    const userAnswer = answers[question.id] || '';
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question}
          </h3>
          {quizComplete && quiz?.show_answers && <div className="mt-2 p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="flex items-center">
                <AlertCircleIcon size={16} className="mr-2" />
                <span>This question requires manual grading</span>
              </div>
              {quiz?.show_answers && <div className="mt-1 text-sm">
                  <strong>Expected answer:</strong> {question.correct_answer}
                </div>}
              {question.explanation && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div>
          <textarea value={userAnswer} onChange={e => handleAnswerChange(question.id, e.target.value)} disabled={quizComplete} rows={4} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter your answer here..."></textarea>
        </div>
      </div>;
  };
  const renderEssay = (question: QuizQuestion) => {
    const userAnswer = answers[question.id] || '';
    return <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            {question.question}
          </h3>
          {quizComplete && <div className="mt-2 p-2 rounded-lg bg-blue-50 text-blue-800">
              <div className="flex items-center">
                <AlertCircleIcon size={16} className="mr-2" />
                <span>This question requires manual grading</span>
              </div>
              {question.explanation && quiz?.show_answers && <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  <strong>Grading guidelines:</strong> {question.explanation}
                </div>}
            </div>}
        </div>
        <div>
          <textarea value={userAnswer} onChange={e => handleAnswerChange(question.id, e.target.value)} disabled={quizComplete} rows={8} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter your answer here..."></textarea>
        </div>
      </div>;
  };
  const renderQuizResults = () => {
    if (!quizComplete || score === null || percentage === null || passed === null) return null;
    return <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className={`h-24 w-24 rounded-full mx-auto flex items-center justify-center ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {passed ? <CheckCircleIcon size={64} /> : <XCircleIcon size={64} />}
          </div>
          <h2 className="text-2xl font-bold mt-4">
            {passed ? 'Congratulations!' : 'Quiz Completed'}
          </h2>
          <p className="text-gray-600 mt-1">
            {passed ? 'You have successfully passed this quiz.' : 'You did not meet the passing score for this quiz.'}
          </p>
        </div>
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 w-48 h-48 rounded-full flex items-center justify-center relative">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="12" fill="transparent" />
              <circle cx="96" cy="96" r="88" stroke={passed ? '#22c55e' : '#ef4444'} strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{percentage}%</div>
                <div className="text-sm text-gray-500">Your Score</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <div>
            <div className="text-sm text-gray-600">Passing Score</div>
            <div className="font-bold">{quiz?.passing_score}%</div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <button onClick={() => navigate('/quizzes')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>;
  };
  if (loading) {
    return <DashboardLayout title="Loading Quiz..." role="student">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>;
  }
  if (!quiz) {
    return <DashboardLayout title="Quiz Not Found" role="student">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircleIcon size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            Quiz Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The quiz you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <button onClick={() => navigate('/quizzes')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Quizzes
          </button>
        </div>
      </DashboardLayout>;
  }
  if (quizComplete) {
    return <DashboardLayout title={quiz.title} role="student">
        {renderQuizResults()}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Review Your Answers
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {questions.map((q, index) => {
              const isAnswered = !!answers[q.id];
              const isCorrect = quizComplete && (q.question_type === 'multiple_choice' || q.question_type === 'true_false') ? answers[q.id] === q.correct_answer : false;
              return <button key={q.id} onClick={() => navigateToQuestion(index)} className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${currentQuestionIndex === index ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-800' : isAnswered ? isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {index + 1}
                  </button>;
            })}
            </div>
            <div className="border-t border-gray-200 pt-6">
              {renderQuestion()}
              <div className="mt-6 flex justify-between">
                <button onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className={`px-4 py-2 rounded-lg flex items-center ${currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  <ArrowLeftIcon size={16} className="mr-1" />
                  Previous
                </button>
                <button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex === questions.length - 1} className={`px-4 py-2 rounded-lg flex items-center ${currentQuestionIndex === questions.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Next
                  <ArrowRightIcon size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout title={quiz.title} role="student">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Quiz Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
            {quiz.description && <p className="text-gray-600 mt-1">{quiz.description}</p>}
          </div>
          {timeRemaining !== null && <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg flex items-center">
              <ClockIcon size={18} className="mr-2" />
              <span className="font-mono font-medium">
                {formatTime(timeRemaining)}
              </span>
            </div>}
        </div>
        {/* Instructions */}
        {quiz.instructions && <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <HelpCircleIcon size={20} className="text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">
                  Instructions
                </h3>
                <p className="text-yellow-700 text-sm">{quiz.instructions}</p>
              </div>
            </div>
          </div>}
        {/* Question Navigator */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questions.map((q, index) => {
          const isAnswered = !!answers[q.id];
          return <button key={q.id} onClick={() => navigateToQuestion(index)} className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${currentQuestionIndex === index ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-800' : isAnswered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {index + 1}
              </button>;
        })}
        </div>
        {/* Current Question */}
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="text-sm text-gray-500">
              {questions[currentQuestionIndex]?.points}{' '}
              {questions[currentQuestionIndex]?.points === 1 ? 'point' : 'points'}
            </div>
          </div>
          {renderQuestion()}
          <div className="mt-6 flex justify-between">
            <div>
              <button onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className={`px-4 py-2 rounded-lg flex items-center ${currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <ArrowLeftIcon size={16} className="mr-1" />
                Previous
              </button>
            </div>
            <div className="flex gap-2">
              {currentQuestionIndex === questions.length - 1 ? <button onClick={submitQuiz} disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  {submitting ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </> : <>
                      <FlagIcon size={16} className="mr-1" />
                      Submit Quiz
                    </>}
                </button> : <button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  Next
                  <ArrowRightIcon size={16} className="ml-1" />
                </button>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};