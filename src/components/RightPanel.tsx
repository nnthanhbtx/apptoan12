import React from 'react';
import { TestResult, Question, UserAnswers } from '../types';
import { soundFx } from '../utils/sound';

interface RightPanelProps {
  questions?: Question[];
  currentQuestionId?: number;
  onSelectQuestion?: (id: number) => void;
  userAnswers?: UserAnswers;
  testResult: TestResult;
  isTeacherMode: boolean;
  isOwnerAuthenticated?: boolean;
  onOpenOwnerAuth?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  testResult,
  isTeacherMode,
  questions = [],
  currentQuestionId = 1,
  onSelectQuestion = (id: number) => {},
  userAnswers = {},
  isOwnerAuthenticated = false,
  onOpenOwnerAuth,
}) => {

  // Check if question is answered
  const isQuestionAnswered = (id: number) => {
    const ans = userAnswers[id];
    if (!ans) return false;
    if (ans.partI !== undefined) return true;
    if (ans.partII && Object.keys(ans.partII).length > 0) return true;
    if (ans.partIII !== undefined && ans.partIII.trim() !== '') return true;
    return false;
  };

  const handleQuestionClick = (id: number) => {
    soundFx.playCorrect(); // Or just a generic click sound if we had one. Let's just call onSelectQuestion and maybe play a click sound. Actually, playCorrect is too celebratory. We can just play a short beep if needed, but let's just trigger onSelectQuestion.
    onSelectQuestion(id);
  };

  const renderGrid = (start: number, end: number) => {
    const gridQs = questions.filter(q => q.id >= start && q.id <= end);
    return (
      <div className="grid grid-cols-4 gap-1.5 mt-2">
        {gridQs.map((q) => {
          const qId = q.id;
          const isSelected = qId === currentQuestionId;
          const answered = isQuestionAnswered(qId);
          let buttonStyle = 'bg-[#0a1630] text-slate-200 border-[#1e345e] hover:bg-[#12244a]';

          if (isSelected) {
            buttonStyle = 'bg-[#facc15] text-[#0f172a] font-extrabold ring-2 ring-amber-300 border-amber-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-pulse';
          } else if (answered) {
            buttonStyle = 'bg-[#10284e] text-emerald-300 border-emerald-500/60 font-bold';
          }

          return (
            <button
              key={qId}
              onClick={() => handleQuestionClick(qId)}
              className={`relative h-8 rounded-md border flex items-center justify-center text-xs transition-all cursor-pointer font-bold ${buttonStyle}`}
            >
              <span>{qId}</span>
              {!isSelected && answered && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#040a1c] p-3.5 rounded-xl border border-[#1e345e] shadow-xl text-slate-100">
      <div className="flex flex-col gap-4">
        {/* Exam Info Title */}
        <div>
          <h2 className="text-center text-xs sm:text-sm font-bold text-[#facc15] tracking-wider uppercase font-serif mb-3">
            THÔNG TIN BÀI THI
          </h2>
          <div className="text-xs space-y-3 text-slate-200 font-medium leading-relaxed bg-[#08122c] p-3 rounded-lg border border-[#1e345e]">
            <div>
              <div className="flex items-start gap-1.5 mb-1">
                <span className="text-[#facc15] font-bold">•</span>
                <span><strong className="text-white">Phần I:</strong> 12 câu trắc nghiệm</span>
              </div>
              {questions.length > 0 && renderGrid(1, 12)}
            </div>
            
            <div className="pt-2 border-t border-[#1e345e]/50">
              <div className="flex items-start gap-1.5 mb-1">
                <span className="text-[#facc15] font-bold">•</span>
                <span><strong className="text-white">Phần II:</strong> 4 câu Đúng / Sai</span>
              </div>
              {questions.length > 0 && renderGrid(13, 16)}
            </div>

            <div className="pt-2 border-t border-[#1e345e]/50">
              <div className="flex items-start gap-1.5 mb-1">
                <span className="text-[#facc15] font-bold">•</span>
                <span><strong className="text-white">Phần III:</strong> 6 câu trả lời ngắn</span>
              </div>
              {questions.length > 0 && renderGrid(17, 22)}
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="text-center pt-2 border-t border-[#1e345e]">
          <h3 className="text-xs sm:text-sm font-bold text-[#facc15] tracking-wider uppercase font-serif mb-2">
            KẾT QUẢ
          </h3>

          {!testResult.submitted ? (
            <p className="text-xs sm:text-sm text-slate-300 font-semibold py-2">
              Chưa nộp bài
            </p>
          ) : (
            <div className="bg-[#08122c] p-3 rounded-lg border border-emerald-500/40 text-left space-y-2">
              <div className="text-center pb-2 border-b border-slate-700/60">
                <span className="text-2xl font-black text-amber-300">
                  {testResult.score.toFixed(1)} / 10
                </span>
                <p className="text-[11px] text-emerald-400 font-bold mt-0.5">
                  Đã hoàn thành bài thi!
                </p>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <p>
                  • Phần I: <span className="font-bold text-white">{testResult.totalCorrectPartI}/12</span> câu
                </p>
                <p>
                  • Phần II: <span className="font-bold text-white">{testResult.totalCorrectPartII}/4</span> câu
                </p>
                <p>
                  • Phần III: <span className="font-bold text-white">{testResult.totalCorrectPartIII}/6</span> câu
                </p>
              </div>
            </div>
          )}

          {isTeacherMode && (
            <div className="mt-3 p-2 bg-indigo-950/70 border border-indigo-500/40 rounded text-left">
              <span className="text-[11px] font-bold text-indigo-300 uppercase block mb-0.5">
                Chế độ Giáo Viên Active:
              </span>
              <p className="text-[11px] text-slate-300 leading-tight">
                Đang hiển thị đáp án chi tiết và hướng dẫn giải cho tất cả câu hỏi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Developer Info at Bottom Right (Clickable for owner login) */}
      <div 
        onClick={onOpenOwnerAuth}
        className="pt-4 border-t border-[#1e345e] text-right text-slate-300 text-[11px] font-medium leading-tight space-y-0.5 cursor-pointer select-none hover:text-amber-300 transition-colors"
        title={isOwnerAuthenticated ? "Quản lý quyền Chủ Tài Khoản" : "Bản quyền ôn thi 2027"}
      >
        <p className="font-bold text-slate-200 hover:text-amber-300 flex items-center justify-end gap-1">
          {isOwnerAuthenticated && <span className="text-xs">👑</span>}
          <span>GV tạo game: Mr Thanh</span>
        </p>
        <p className="text-slate-400">Ôn thi THPT 2027</p>
      </div>
    </div>
  );
};
