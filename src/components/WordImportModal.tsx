import React, { useState } from 'react';
import { Question } from '../types';
import {
  extractTextFromDocx,
  parseExamText,
  SAMPLE_WORD_FORMAT,
  downloadSampleFormatFile,
} from '../lib/wordParser';

interface WordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (newQuestions: Question[]) => void;
}

export const WordImportModal: React.FC<WordImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'FORMAT_GUIDE' | 'PASTE'>('UPLOAD');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  // Handle File Change (.docx or .txt)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setErrors([]);

    try {
      const rawText = await extractTextFromDocx(file);
      setPastedText(rawText);
      const result = parseExamText(rawText);
      setParsedQuestions(result.questions);
      setErrors(result.errors);
    } catch (err: any) {
      setErrors([`Lỗi khi đọc file Word: ${err?.message || 'File không hợp lệ hoặc bị khóa.'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle parse pasted text
  const handleParsePastedText = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedQuestions([]);
      setErrors([]);
      return;
    }
    const result = parseExamText(text);
    setParsedQuestions(result.questions);
    setErrors(result.errors);
  };

  // Copy sample format
  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_WORD_FORMAT);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Submit parsed questions to app
  const handleApplyQuestions = () => {
    if (parsedQuestions.length === 0) {
      alert('Vui lòng tải file hoặc dán đúng định dạng câu hỏi trước khi áp dụng.');
      return;
    }
    onImportQuestions(parsedQuestions);
    onClose();
  };

  // Part counts
  const p1Count = parsedQuestions.filter((q) => q.section === 'PART_I').length;
  const p2Count = parsedQuestions.filter((q) => q.section === 'PART_II').length;
  const p3Count = parsedQuestions.filter((q) => q.section === 'PART_III').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#08122c] border-2 border-amber-400/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#040a1c] border-b border-[#1e345e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400 text-slate-900 font-black text-xs">
              DOCX
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#facc15] tracking-wide uppercase font-serif">
              TẠO ĐỀ BẰNG FILE WORD / VĂN BẢN
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-xl font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e345e] bg-[#030712] px-3 gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'UPLOAD'
                ? 'border-[#facc15] text-[#facc15] bg-[#08122c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📁 TẢI FILE WORD (.DOCX)
          </button>

          <button
            onClick={() => setActiveTab('FORMAT_GUIDE')}
            className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'FORMAT_GUIDE'
                ? 'border-[#facc15] text-[#facc15] bg-[#08122c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 ĐỊNH DẠNG MẪU (HƯỚNG DẪN)
          </button>

          <button
            onClick={() => setActiveTab('PASTE')}
            className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'PASTE'
                ? 'border-[#facc15] text-[#facc15] bg-[#08122c]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ DÁN NỘI DUNG VĂN BẢN
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-amber-400/50 bg-[#040a1c] p-6 rounded-xl text-center space-y-3 hover:border-amber-400 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300 text-2xl font-bold">
                  📄
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Chọn hoặc kéo thả file <strong className="text-amber-300">.docx</strong> (Word) hoặc <strong className="text-amber-300">.txt</strong> vào đây
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hệ thống sẽ tự động trích xuất nội dung và phân loại thành các Phần I, II, III
                  </p>
                </div>

                <label className="inline-block py-2 px-5 rounded-lg bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#eab308] text-slate-900 font-extrabold text-xs uppercase tracking-wider cursor-pointer hover:brightness-110 shadow-md">
                  CHỌN FILE WORD NẠP ĐỀ
                  <input
                    type="file"
                    accept=".docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {fileName && (
                  <p className="text-xs text-emerald-400 font-bold mt-2">
                    ✓ Đã chọn file: {fileName}
                  </p>
                )}
              </div>

              {isLoading && (
                <div className="text-center py-4 text-amber-300 text-xs font-bold animate-pulse">
                  ⏳ Đang đọc nội dung và phân tích câu hỏi từ file Word...
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAMPLE FORMAT GUIDE */}
          {activeTab === 'FORMAT_GUIDE' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl text-xs text-amber-200 space-y-1.5">
                <p className="font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <span>💡</span> Quy tắc soạn thảo văn bản trong file Word:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Tất cả câu hỏi</strong> bắt đầu bằng <code>Câu 1.</code>, <code>Câu 2.</code>, ...</li>
                  <li><strong>Phần I (Trắc nghiệm):</strong> 4 phương án bắt đầu bằng <code>A.</code>, <code>B.</code>, <code>C.</code>, <code>D.</code> Dòng đáp án: chỉ cần gạch chân 1 trong 4 lựa chọn A,B,C,D</li>
                  <li><strong>Phần II (Đúng / Sai):</strong> 4 mệnh đề <code>a)</code>, <code>b)</code>, <code>c)</code>, <code>d)</code> chỉ cần gạch chân đáp án đúng</li>
                  <li><strong>Phần III (Trả lời ngắn):</strong> Ghi rõ dòng <code>Đáp số: [giá trị]</code></li>
                  <li><strong>Hướng dẫn giải (Tùy chọn):</strong> Thêm dòng <code>Lời giải: [nội dung]</code> ở cuối câu</li>
                  <li><strong>Công thức Toán học:</strong> Nhập công thức Toán học dưới dạng mã LaTeX, kẹp giữa dấu <code>$</code> (Ví dụ: <code>$x^2 + 1 = 0$</code>) để hệ thống tự động nhận diện và hiển thị. Không sử dụng Equation của Word vì sẽ không được nhận diện.</li>
                  <li><strong>Hình vẽ:</strong> Để dưới dạng <code>in line with text</code></li>
                </ul>
              </div>

              {/* DEDICATED IMAGE & DIAGRAM GUIDE BOX */}
              <div className="p-3 bg-cyan-950/50 border border-cyan-500/50 rounded-xl text-xs text-cyan-200 space-y-2">
                <p className="font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                  <span>🖼️</span> HƯỚNG DẪN THÊM ẢNH ĐÍNH KÈM VÀ HÌNH VẼ MINH HỌA:
                </p>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-amber-300">Cách 1: Chèn ảnh trực tiếp trong File Word (.docx)</strong>
                    <br />
                    • Chèn/Chép trực tiếp hình ảnh (JPG, PNG) vào nội dung câu hỏi trong file Word. Hệ thống sẽ tự động trích xuất và hiển thị ảnh.
                  </p>
                  <p>
                    <strong className="text-amber-300">Cách 2: Sử dụng đường dẫn URL ảnh công khai</strong>
                    <br />
                    • Thêm dòng cú pháp trong câu hỏi: <code>[Hình ảnh: https://domain.com/hinh.png]</code> hoặc <code>[Ảnh: https://...]</code>
                  </p>
                  <p>
                    <strong className="text-amber-300">Cách 3: Sử dụng Mã Hình Vẽ Hình Học / Đồ Thị Chuẩn TikZ Dựng Sẵn</strong>
                    <br />
                    • Thêm cú pháp thẻ hình vẽ vào bất kỳ đâu trong câu hỏi:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#030712] p-2 rounded border border-cyan-800 text-[10px] font-mono text-cyan-200">
                    <div>• <code>[Hình: GRAPH]</code> : Đồ thị hàm số / Cực trị</div>
                    <div>• <code>[Hình: OXYZ]</code> : Hệ trục tọa độ Oxyz</div>
                    <div>• <code>[Hình: PRISM]</code> : Hình lăng trụ tam giác</div>
                    <div>• <code>[Hình: PYRAMID_SABCD]</code> : Hình chóp S.ABCD</div>
                    <div>• <code>[Hình: PYRAMID_SABC]</code> : Hình chóp S.ABC</div>
                    <div>• <code>[Hình: TRIANGLE_SECRET]</code> : Mật thư tam giác</div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    * Mẹo: Nếu đề thi có chứa từ khóa "lăng trụ", "đồ thị", "Oxyz", "chóp S.ABCD", hệ thống sẽ tự động phát hiện và gán hình vẽ phù hợp nếu bạn không khai báo thẻ thủ công.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-300">
                  MẪU ĐỊNH DẠNG VĂN BẢN CHUẨN:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySample}
                    className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    {copySuccess ? '✓ Đã sao chép' : '📋 Sao chép mẫu'}
                  </button>
                  <button
                    onClick={downloadSampleFormatFile}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-900 transition-all cursor-pointer"
                  >
                    ⬇ Tải file mẫu (.txt)
                  </button>
                </div>
              </div>

              <pre className="p-3 bg-[#030712] border border-slate-700 rounded-xl text-[11px] font-mono text-emerald-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap selection:bg-amber-400 selection:text-black">
                {SAMPLE_WORD_FORMAT}
              </pre>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    handleParsePastedText(SAMPLE_WORD_FORMAT);
                    setActiveTab('PASTE');
                  }}
                  className="py-1.5 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  SỬ DỤNG MẪU NÀY ĐỂ MÔ PHỎNG DÁN ĐỀ THI
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PASTE RAW TEXT */}
          {activeTab === 'PASTE' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-amber-300 block">
                Dán toàn bộ văn bản đề thi từ File Word vào khung bên dưới:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => handleParsePastedText(e.target.value)}
                placeholder="Dán nội dung từ file Word tại đây... (Ví dụ: Câu 1. Cho hàm số... A. ... B. ... C. ... D. ... Đáp án: A)"
                rows={10}
                className="w-full p-3 rounded-xl bg-[#030712] border border-slate-700 text-slate-200 text-xs font-mono focus:border-amber-400 focus:outline-none placeholder:text-slate-600 leading-relaxed"
              />
            </div>
          )}

          {/* PARSED STATUS & ERRORS SUMMARY */}
          {parsedQuestions.length > 0 && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-emerald-300">
                <span>✓ ĐÃ NHẬN DIỆN THÀNH CÔNG {parsedQuestions.length} CÂU HỎI</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-200 font-semibold bg-[#040a1c] p-2 rounded border border-emerald-900">
                <p>• Phần I (Trắc nghiệm): <strong className="text-amber-300">{p1Count} câu</strong></p>
                <p>• Phần II (Đúng/Sai): <strong className="text-cyan-300">{p2Count} câu</strong></p>
                <p>• Phần III (Trả lời ngắn): <strong className="text-rose-300">{p3Count} câu</strong></p>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs space-y-1 text-rose-300">
              <strong className="block text-rose-400 font-bold uppercase">
                ⚠️ Cảnh báo / Lỗi nhận diện:
              </strong>
              {errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#040a1c] border-t border-[#1e345e] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold uppercase transition-all cursor-pointer"
          >
            HỦY BỎ
          </button>

          <button
            onClick={handleApplyQuestions}
            disabled={parsedQuestions.length === 0}
            className="px-5 py-2 rounded-lg bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] text-white font-extrabold text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-lg border border-emerald-400/50 cursor-pointer"
          >
            ÁP DỤNG ĐỀ THI NÀY ({parsedQuestions.length} CÂU)
          </button>
        </div>
      </div>
    </div>
  );
};
