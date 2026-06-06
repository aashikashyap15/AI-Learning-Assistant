import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  BookOpen
} from 'lucide-react';

const QuizResultPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await quizService.getQuizResults(quizId);
        setResults(data);
      } catch (error) {
        toast.error('Failed to fetch quiz results.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!results || !results.data) {
    return (
      <div className="text-center mt-10">
        <p>Quiz results not found.</p>
      </div>
    );
  }

  const { data: { quiz, results: detailedResults = [] } } = results;

  const score = quiz.score;
  const totalQuestions = detailedResults.length;
  const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Outstanding!';
    if (score >= 80) return 'Great job!';
    if (score >= 70) return 'Good work!';
    if (score >= 60) return 'Not bad!';
    return 'Keep practicing!';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Back Button */}
      <Link
        to={`/documents/${quiz.document._id}`}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back to Document
      </Link>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800">
        {quiz.title || 'Quiz'} Results
      </h1>

      {/* Score Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3">
        <div className="bg-emerald-100 p-4 rounded-2xl">
          <Trophy className="text-emerald-500" size={36} strokeWidth={2} />
        </div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mt-1">
          Your Score
        </p>
        <p className={`text-6xl font-extrabold ${getScoreColor(score)}`}>
          {score}%
        </p>
        <p className="text-gray-700 font-medium text-lg">{getScoreMessage(score)}</p>

        <div className="w-full border-t border-gray-100 mt-4 pt-4 flex justify-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 font-medium">
            <Target size={16} className="text-gray-500" />
            {totalQuestions} Total
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 text-sm text-emerald-700 font-medium">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {correctAnswers} Correct
          </div>
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-full px-4 py-2 text-sm text-rose-700 font-medium">
            <XCircle size={16} className="text-rose-500" />
            {incorrectAnswers} Incorrect
          </div>
        </div>
      </div>

      {/* Detailed Review Header */}
      <div className="flex items-center gap-2 text-gray-800 mt-2">
        <BookOpen size={20} strokeWidth={2} />
        <h3 className="text-xl font-semibold">Detailed Review</h3>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {detailedResults.map((result, index) => {
          const userAnswerIndex = result.options.findIndex(
            opt => opt === result.selectedAnswer
          );

          const correctAnswerIndex = result.correctAnswer?.startsWith('0')
            ? parseInt(result.correctAnswer.substring(1)) - 1
            : result.options.findIndex(opt => opt === result.correctAnswer);

          const isCorrect = result.isCorrect;
          const explanation = result.explanation || 'No explanation provided.';

          return (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                    Question {index + 1}
                  </span>
                  <h4 className="font-semibold text-gray-800 text-base mt-1">
                    {result.question}
                  </h4>
                </div>
                {isCorrect ? (
                  <div className="bg-emerald-100 rounded-full p-2 ml-4 shrink-0">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  </div>
                ) : (
                  <div className="bg-rose-100 rounded-full p-2 ml-4 shrink-0">
                    <XCircle className="text-rose-500" size={20} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {result.options.map((option, optIndex) => {
                  const isCorrectOption = optIndex === correctAnswerIndex;
                  const isUserAnswer = optIndex === userAnswerIndex;
                  const isWrongAnswer = isUserAnswer && !isCorrect;

                  return (
                    <div
                      key={optIndex}
                      className={`px-4 py-3 rounded-xl border flex justify-between items-center text-sm font-medium transition-all
                        ${isCorrectOption
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : isWrongAnswer
                          ? 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'bg-white border-gray-200 text-gray-700'
                        }`}
                    >
                      <span>{option}</span>
                      {isCorrectOption && (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <CheckCircle2 size={15} /> Correct
                        </span>
                      )}
                      {isWrongAnswer && (
                        <span className="flex items-center gap-1 text-rose-600 text-xs font-semibold">
                          <XCircle size={15} /> Wrong
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <BookOpen size={18} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
                    Explanation
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">{explanation}</p>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* 🔥 FIXED BOTTOM BUTTON */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => navigate(`/documents/${quiz.document._id}`)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
        >
          <ArrowLeft size={16} />
          Return to Document
        </button>
      </div>

    </div>
  );
};

export default QuizResultPage;