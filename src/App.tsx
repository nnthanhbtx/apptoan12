import React, { useState, useEffect, useRef } from 'react';
import { QUESTIONS as DEFAULT_QUESTIONS } from './data/questions';
import { UserAnswers, TestResult, Question, ExamRecord } from './types';
import { LeftPanel } from './components/LeftPanel';
import { MiddlePanel } from './components/MiddlePanel';
import { RightPanel } from './components/RightPanel';
import { SubmitModal } from './components/SubmitModal';
import { Leaderboard } from './components/Leaderboard';
import { LeaderboardEntry } from './types';
import { WordImportModal } from './components/WordImportModal';
import { StartModal } from './components/StartModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { soundFx } from './utils/sound';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('quiz_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_QUESTIONS;
  });

  const [examHistory, setExamHistory] = useState<ExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem('quiz_exam_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 1,
        title: 'Đề thi số 1 (Mặc định)',
        questions: DEFAULT_QUESTIONS,
        timestamp: Date.now(),
      },
    ];
  });

  const [currentExamId, setCurrentExamId] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(() => {
    try {
      const saved = localStorage.getItem('quiz_user_answers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('quiz_time_remaining');
      if (saved) return Number(saved);
    } catch (e) {}
    return 90 * 60; // 90 minutes
  });

  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('quiz_is_owner_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isOwnerAuthModalOpen, setIsOwnerAuthModalOpen] = useState(false);
  const [isStarted, setIsStarted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quiz_is_started');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'question' | 'controls' | 'grid'>('question');

  const [playerInfo, setPlayerInfo] = useState<{name: string, className: string}>(() => {
    try {
      const saved = localStorage.getItem('quiz_player_info');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { name: '', className: '' };
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('quiz_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({
    submitted: false,
    score: 0,
    partIScore: 0,
    partIIScore: 0,
    partIIIScore: 0,
    totalCorrectPartI: 0,
    totalCorrectPartII: 0,
    totalCorrectPartIII: 0,
    timeSpentSeconds: 0,
  });

  const appContainerRef = useRef<HTMLDivElement>(null);
  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Sync state to localStorage for offline preservation
  useEffect(() => {
    try {
      localStorage.setItem('quiz_user_answers', JSON.stringify(userAnswers));
    } catch (e) {}
  }, [userAnswers]);

  useEffect(() => {
    try {
      localStorage.setItem('quiz_questions', JSON.stringify(questions));
    } catch (e) {}
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('quiz_exam_history', JSON.stringify(examHistory));
    } catch (e) {}
  }, [examHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('quiz_time_remaining', String(timeRemaining));
    } catch (e) {}
  }, [timeRemaining]);

  useEffect(() => {
    try {
      localStorage.setItem('quiz_is_started', JSON.stringify(isStarted));
    } catch (e) {}
  }, [isStarted]);

  useEffect(() => {
    try {
      localStorage.setItem('quiz_player_info', JSON.stringify(playerInfo));
    } catch (e) {}
  }, [playerInfo]);

  // Global shortcut for teacher / owner authentication (Ctrl+Shift+O or Alt+G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'O' || e.key === 'o')) || (e.altKey && (e.key === 'g' || e.key === 'G'))) {
        e.preventDefault();
        setIsOwnerAuthModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Countdown timer interval
  useEffect(() => {
    if (isSubmitted || !isStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          calculateAndSubmitScore();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, isStarted]);

  // Handle option selection for Part I
  const handleSelectOptionPartI = (
    questionId: number,
    optionKey: 'A' | 'B' | 'C' | 'D'
  ) => {
    if (isSubmitted) return;
    if (!isStarted) {
      setIsStartModalOpen(true);
      return;
    }
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        partI: optionKey,
      },
    }));

    // Play audio feedback for correct/incorrect answer
    const q = questions.find((item) => item.id === questionId);
    if (q) {
      if (optionKey === q.correctAnswer) {
        soundFx.playCorrect();
      } else {
        soundFx.playIncorrect();
      }
    }
  };

  // Handle statement toggle for Part II
  const handleSelectOptionPartII = (
    questionId: number,
    statementKey: 'a' | 'b' | 'c' | 'd',
    value: boolean
  ) => {
    if (isSubmitted) return;
    if (!isStarted) {
      setIsStartModalOpen(true);
      return;
    }
    setUserAnswers((prev) => {
      const prevPartII = prev[questionId]?.partII || {};
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          partII: {
            ...prevPartII,
            [statementKey]: value,
          },
        },
      };
    });

    // Play audio feedback for correct/incorrect statement selection
    const q = questions.find((item) => item.id === questionId);
    if (q) {
      const stmt = q.statements?.find((s) => s.key === statementKey);
      if (stmt) {
        if (value === stmt.correct) {
          soundFx.playCorrect();
        } else {
          soundFx.playIncorrect();
        }
      }
    }
  };

  // Handle input change for Part III
  const handleChangeAnswerPartIII = (questionId: number, value: string) => {
    if (isSubmitted) return; 
    if (!isStarted) {
      setIsStartModalOpen(true);
      return;
    }
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        partIII: value,
      },
    }));

    // Play audio feedback if user types correct answer
    const q = questions.find((item) => item.id === questionId);
    if (q && value.trim() !== '') {
      if (value.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        soundFx.playCorrect();
      }
    }
  };

  // Toggle audio sound
  const handleToggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      soundFx.enabled = next;
      return next;
    });
  };

  // Select question by ID
  const handleSelectQuestion = (id: number) => {
    const index = questions.findIndex((q) => q.id === id);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      setMobileTab('question');
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    try {
      const elem = appContainerRef.current as any;
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (elem?.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem?.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen API not supported');
    }
  };

  // Owner Authentication handlers
  const handleAuthenticateOwner = (pin: string): boolean => {
    const storedPin = localStorage.getItem('quiz_owner_pin') || '2027';
    if (pin === storedPin) {
      setIsOwnerAuthenticated(true);
      try {
        localStorage.setItem('quiz_is_owner_authenticated', 'true');
      } catch (e) {}
      return true;
    }
    return false;
  };

  const handleChangeOwnerPin = (oldPin: string, newPin: string): boolean => {
    const storedPin = localStorage.getItem('quiz_owner_pin') || '2027';
    if (oldPin === storedPin) {
      try {
        localStorage.setItem('quiz_owner_pin', newPin);
      } catch (e) {}
      return true;
    }
    return false;
  };

  const handleLogoutOwner = () => {
    setIsOwnerAuthenticated(false);
    setIsTeacherMode(false);
    try {
      localStorage.setItem('quiz_is_owner_authenticated', 'false');
    } catch (e) {}
  };

  // Toggle Teacher Mode (strictly for owner)
  const handleToggleTeacherMode = () => {
    if (!isOwnerAuthenticated) {
      setIsOwnerAuthModalOpen(true);
      return;
    }
    setIsTeacherMode((prev) => !prev);
  };

  // Open Word Import (strictly for owner)
  const handleOpenWordImport = () => {
    if (!isOwnerAuthenticated) {
      setIsOwnerAuthModalOpen(true);
      return;
    }
    setIsWordModalOpen(true);
  };

  // Import questions from Word / text file
  const handleImportQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    setExamHistory((prev) => {
      const newId = prev.length + 1;
      return [
        ...prev,
        {
          id: newId,
          title: `Đề tải lên ${newId - 1}`,
          questions: newQuestions,
          timestamp: Date.now(),
        },
      ];
    });
    setCurrentExamId(examHistory.length + 1);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(87 * 60 + 16);
    setIsStarted(false);
    setIsSubmitted(false);
    setIsTeacherMode(false);
    setTestResult({
      submitted: false,
      score: 0,
      partIScore: 0,
      partIIScore: 0,
      partIIIScore: 0,
      totalCorrectPartI: 0,
      totalCorrectPartII: 0,
      totalCorrectPartIII: 0,
      timeSpentSeconds: 0,
    });
    setIsWordModalOpen(false);
  };

  // Select a past exam
  const handleSelectHistoryExam = (exam: ExamRecord) => {
    if (exam.id === currentExamId) return;
    if (window.confirm(`Bạn có chắc chắn muốn chuyển sang ${exam.title}? Dữ liệu bài thi đang làm sẽ bị xóa.`)) {
      setQuestions(exam.questions);
      setCurrentExamId(exam.id);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(90 * 60);
      setIsStarted(false);
      setIsSubmitted(false);
      setIsTeacherMode(false);
      setTestResult({
        submitted: false,
        score: 0,
        partIScore: 0,
        partIIScore: 0,
        partIIIScore: 0,
        totalCorrectPartI: 0,
        totalCorrectPartII: 0,
        totalCorrectPartIII: 0,
        timeSpentSeconds: 0,
      });
    }
  };

  const handleSaveScore = (scoreData: { playerName: string, className?: string, score: number, timeSpentSeconds: number }) => {
    const entry: LeaderboardEntry = {
      playerName: scoreData.playerName,
      className: scoreData.className,
      score: scoreData.score,
      timeSpentSeconds: scoreData.timeSpentSeconds,
      date: Date.now()
    };
    
    setLeaderboard(prev => {
      const newList = [...prev, entry].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeSpentSeconds - b.timeSpentSeconds; // lower time is better
      }).slice(0, 10);
      
      try {
        localStorage.setItem('quiz_leaderboard', JSON.stringify(newList));
      } catch(e) {}
      
      return newList;
    });
  };

  // Reset Test for SubmitModal
  const handleReset = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(90 * 60);
    setIsStarted(false);
    setIsSubmitted(false);
    setTestResult({
      submitted: false,
      score: 0,
      partIScore: 0,
      partIIScore: 0,
      partIIIScore: 0,
      totalCorrectPartI: 0,
      totalCorrectPartII: 0,
      totalCorrectPartIII: 0,
      timeSpentSeconds: 0,
    });
  };

  // Calculate score and submit
  const calculateAndSubmitScore = () => {
    let p1Correct = 0;
    let p1Score = 0;

    let p2CorrectFull = 0;
    let p2Score = 0;

    let p3Correct = 0;
    let p3Score = 0;

    questions.forEach((q) => {
      const ans = userAnswers[q.id];

      if (q.section === 'PART_I') {
        if (ans?.partI === q.correctAnswer) {
          p1Correct += 1;
          p1Score += 0.25;
        }
      } else if (q.section === 'PART_II') {
        if (ans?.partII) {
          let correctStmts = 0;
          q.statements.forEach((stmt) => {
            if (ans.partII?.[stmt.key] === stmt.correct) {
              correctStmts += 1;
            }
          });

          if (correctStmts === 1) p2Score += 0.1;
          else if (correctStmts === 2) p2Score += 0.25;
          else if (correctStmts === 3) p2Score += 0.5;
          else if (correctStmts === 4) {
            p2Score += 1.0;
            p2CorrectFull += 1;
          }
        }
      } else if (q.section === 'PART_III') {
        if (
          ans?.partIII &&
          ans.partIII.trim().toLowerCase() ===
            q.correctAnswer.trim().toLowerCase()
        ) {
          p3Correct += 1;
          p3Score += 0.5;
        }
      }
    });

    const totalScore = Math.min(10, p1Score + p2Score + p3Score);
    const timeSpent = 90 * 60 - timeRemaining;

    const result: TestResult = {
      submitted: true,
      score: totalScore,
      partIScore: p1Score,
      partIIScore: p2Score,
      partIIIScore: p3Score,
      totalCorrectPartI: p1Correct,
      totalCorrectPartII: p2CorrectFull,
      totalCorrectPartIII: p3Correct,
      timeSpentSeconds: timeSpent,
    };

    setTestResult(result);
    setIsSubmitted(true);
    setIsModalOpen(true);
    setTimeRemaining(90 * 60); // Reset timer to 90:00

    // Auto-save score if we have player info
    if (playerInfo.name) {
      handleSaveScore({
        playerName: playerInfo.name,
        className: playerInfo.className,
        score: totalScore,
        timeSpentSeconds: timeSpent
      });
    }
  };

  // Format timer for mobile top bar
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Helper to check if question is answered for quick selector
  const isQuestionAnswered = (id: number) => {
    const ans = userAnswers[id];
    if (!ans) return false;
    if (ans.partI !== undefined) return true;
    if (ans.partII && Object.keys(ans.partII).length > 0) return true;
    if (ans.partIII !== undefined && ans.partIII.trim() !== '') return true;
    return false;
  };

  return (
    <div
      ref={appContainerRef}
      className="min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col items-center justify-start lg:justify-center p-2 sm:p-3 selection:bg-amber-400 selection:text-black font-sans pb-safe pt-safe"
    >
      {/* MOBILE STICKY TOP BAR & VIEW SWITCHER (ONLY ON MOBILE < LG) */}
      <div className="w-full max-w-7xl lg:hidden flex flex-col gap-2 mb-2 sticky top-0 z-30 bg-[#020617]/95 backdrop-blur pt-1 pb-1 border-b border-[#1e345e]/80">
        {/* Top Info Strip */}
        <div className="flex items-center justify-between bg-[#040a1c] p-2 rounded-xl border border-[#1e345e]">
          {/* App Badge & Owner Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-extrabold text-sm sm:text-base">🏆</span>
            <button
              onClick={() => setIsOwnerAuthModalOpen(true)}
              className="text-xs font-bold text-[#facc15] font-serif uppercase tracking-wider truncate max-w-[150px] sm:max-w-none text-left cursor-pointer hover:underline"
              title="AI Là Triệu Phú Toán Học"
            >
              TRIỆU PHÚ TOÁN
            </button>
            {isOwnerAuthenticated && (
              <button
                onClick={() => setIsOwnerAuthModalOpen(true)}
                className="p-1 rounded-md text-[10px] font-bold border transition cursor-pointer flex items-center gap-0.5 bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-sm animate-pulse"
                title="Chủ tài khoản (Đã đăng nhập)"
              >
                <span>👑</span>
              </button>
            )}
          </div>

          {/* Quick Question Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={currentQuestion ? currentQuestion.id : 1}
              onChange={(e) => handleSelectQuestion(Number(e.target.value))}
              className="bg-[#08122c] border border-amber-400/80 text-amber-300 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {questions.map((q) => {
                const answered = isQuestionAnswered(q.id);
                return (
                  <option key={q.id} value={q.id} className="bg-[#0f172a] text-slate-100">
                    Câu {q.id} {answered ? '✓' : ''}
                  </option>
                );
              })}
            </select>

            {/* Timer Badge */}
            <div className="px-2.5 py-1 rounded-lg bg-[#030712] border border-amber-400/80 text-amber-300 font-mono font-bold text-xs tracking-wider">
              ⏱️ {formattedTime}
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-[#040a1c] p-1 rounded-xl border border-[#1e345e]">
          <button
            onClick={() => setMobileTab('question')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mobileTab === 'question'
                ? 'bg-[#facc15] text-[#0f172a] shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>📝</span>
            <span>CÂU HỎI</span>
          </button>

          <button
            onClick={() => setMobileTab('controls')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mobileTab === 'controls'
                ? 'bg-[#facc15] text-[#0f172a] shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>⚙️</span>
            <span>ĐIỀU KHIỂN</span>
          </button>

          <button
            onClick={() => setMobileTab('grid')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mobileTab === 'grid'
                ? 'bg-[#facc15] text-[#0f172a] shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>DANH SÁCH</span>
          </button>
        </div>
      </div>

      {/* 3-Column Container Layout */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Column 1 (Left Panel - Control Panel) */}
        <div
          className={`lg:col-span-3 w-full flex order-2 lg:order-1 ${
            mobileTab === 'controls' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <LeftPanel
            currentQuestionId={currentQuestion ? currentQuestion.id : 1}
            onSelectQuestion={handleSelectQuestion}
            timeRemainingSeconds={timeRemaining}
            onSubmit={calculateAndSubmitScore}
            onStart={() => setIsStartModalOpen(true)}
            isStarted={isStarted}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleTeacherMode={handleToggleTeacherMode}
            isTeacherMode={isOwnerAuthenticated && isTeacherMode}
            onToggleSound={handleToggleSound}
            isSoundEnabled={isSoundEnabled}
            onOpenWordImport={handleOpenWordImport}
            userAnswers={userAnswers}
            questions={questions}
            isSubmitted={isSubmitted}
            examHistory={examHistory}
            onSelectHistoryExam={handleSelectHistoryExam}
            currentExamId={currentExamId}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            isOwnerAuthenticated={isOwnerAuthenticated}
            onOpenOwnerAuth={() => setIsOwnerAuthModalOpen(true)}
            onLogoutOwner={handleLogoutOwner}
          />
        </div>

        {/* Column 2 (Middle Panel - Header Title, Question Content, Diagram, Options) */}
        <div
          className={`lg:col-span-6 w-full flex order-1 lg:order-2 ${
            mobileTab === 'question' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {currentQuestion && (
            <MiddlePanel
              question={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              userAnswers={userAnswers}
              onSelectOptionPartI={handleSelectOptionPartI}
              onSelectOptionPartII={handleSelectOptionPartII}
              onChangeAnswerPartIII={handleChangeAnswerPartIII}
              onPrev={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              onNext={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              isTeacherMode={isOwnerAuthenticated && isTeacherMode}
              isSubmitted={isSubmitted}
              onOpenOwnerAuth={() => setIsOwnerAuthModalOpen(true)}
            />
          )}
        </div>

        {/* Column 3 (Right Panel - Exam Info & Question Grid) */}
        <div
          className={`lg:col-span-3 w-full flex order-3 lg:order-3 ${
            mobileTab === 'grid' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <RightPanel
            testResult={testResult}
            isTeacherMode={isOwnerAuthenticated && isTeacherMode}
            questions={questions}
            currentQuestionId={currentQuestion ? currentQuestion.id : 1}
            onSelectQuestion={handleSelectQuestion}
            userAnswers={userAnswers}
            isOwnerAuthenticated={isOwnerAuthenticated}
            onOpenOwnerAuth={() => setIsOwnerAuthModalOpen(true)}
          />
        </div>
      </div>

      {/* Submission Result Modal */}
      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={testResult}
        onReview={() => setIsTeacherMode(true)}
        onRestart={handleReset}
        onSaveScore={() => {}} // Saved automatically
      />

      <Leaderboard 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        entries={leaderboard} 
      />

      {/* Word File Import Modal */}
      <WordImportModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        onImportQuestions={handleImportQuestions}
      />

      {/* Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={isOwnerAuthModalOpen}
        onClose={() => setIsOwnerAuthModalOpen(false)}
        isOwnerAuthenticated={isOwnerAuthenticated}
        onAuthenticate={handleAuthenticateOwner}
        onChangePin={handleChangeOwnerPin}
        onLogout={handleLogoutOwner}
      />

      <StartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={(name, className) => {
          setPlayerInfo({ name, className });
          setIsStartModalOpen(false);
          setIsStarted(true);
        }}
      />
    </div>
  );
}
