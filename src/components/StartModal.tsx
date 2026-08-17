import React, { useState } from 'react';

interface StartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (name: string, className: string) => void;
}

export const StartModal: React.FC<StartModalProps> = ({ isOpen, onClose, onStart }) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!className.trim()) {
      setError('Vui lòng nhập lớp');
      return;
    }
    setError('');
    onStart(name.trim(), className.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-900 hover:text-black hover:bg-amber-300 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold text-slate-900 text-center">
            THÔNG TIN THÍ SINH
          </h2>
          <p className="text-sm text-slate-900/80 text-center mt-1">
            Vui lòng điền thông tin trước khi bắt đầu
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                placeholder="Nhập họ và tên..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Lớp *
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                placeholder="Ví dụ: 12A1"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="mt-2 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-900 font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>🚀</span> BẮT ĐẦU LÀM BÀI
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
