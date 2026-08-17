import mammoth from 'mammoth/mammoth.browser.js';
import { Question } from '../types';

export const SAMPLE_WORD_FORMAT = `==== ĐỀ THI TRẮC NGHIỆM MẪU (THPT 2027) ====

PHẦN I. Câu hỏi trắc nghiệm nhiều lựa chọn (Từ câu 1 đến câu 12)

Câu 1. Cho hàm số $y = f(x)$ có bảng biến thiên trên đoạn $[-2; 3]$. Tìm giá trị lớn nhất $M$ của $f(x)$ trên $[-2; 3]$.
[Hình: GRAPH]
A. $M = 5$.
B. $M = 3$.
C. $M = -2$.
D. $M = 0$.
Đáp án: A
Lời giải: Dựa vào đồ thị/bảng biến thiên, giá trị cao nhất của đồ thị trên đoạn $[-2; 3]$ là $y = 5$ tại $x = 1$.

Câu 2. Tập xác định $D$ của hàm số $y = \\log_2(x - 3)$ là:
A. $D = (3; +\\infty)$.
B. $D = [3; +\\infty)$.
C. $D = (-\\infty; 3)$.
D. $D = \\mathbb{R} \\setminus \\{3\\}$.
Đáp án: A
Lời giải: Hàm số logarit xác định khi $x - 3 > 0 \\Leftrightarrow x > 3$.

Câu 3. Trong không gian $Oxyz$, cho điểm $M(2; 3; 4)$. Tìm tọa độ hình chiếu vuông góc $H$ của $M$ trên mặt phẳng $(Oxy)$.
[Hình: OXYZ]
A. $H(2; 3; 0)$.
B. $H(0; 0; 4)$.
C. $H(2; 0; 0)$.
D. $H(0; 3; 0)$.
Đáp án: A
Lời giải: Hình chiếu của $M(x, y, z)$ lên mặt phẳng $(Oxy)$ giữ nguyên $x, y$ và cho $z = 0$.

PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai (Từ câu 13 đến câu 16)

Câu 13. Cho hàm số $f(x) = x^3 - 3x + 2$. Xét tính đúng sai của các mệnh đề sau:
a) Hàm số $f(x)$ có hai điểm cực trị. [Đúng]
b) Giá trị cực đại của hàm số bằng $4$. [Đúng]
c) Hàm số nghịch biến trên khoảng $(-1; 1)$. [Đúng]
d) Đồ thị hàm số cắt trục tung tại điểm $(0; 1)$. [Sai]
Lời giải: $f'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$.
$f(1) = 0$, $f(-1) = 4$. Đồ thị cắt $Oy$ tại $(0; 2)$.

PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn (Từ câu 17 đến câu 22)

Câu 17. Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA$ vuông góc với đáy $(ABCD)$. Tính góc giữa đường thẳng $SD$ và mặt phẳng $(ABCD)$.
[Hình: PYRAMID_SABCD]
Đáp số: 60
Lời giải: $SA \perp (ABCD)$ nên $AD$ là hình chiếu của $SD$ lên $(ABCD)$. Góc cần tìm là góc $\widehat{SDA}$.`;


/**
 * Extract raw text from a .docx File using Mammoth (including embedded images as base64)
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  if (file.name.endsWith('.txt')) {
    return await file.text();
  }

  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: ["u => u", "strike => s"],
        convertImage: (mammoth.images as any).inline((element: any) => {
          return element.read('base64').then((imageBuffer: string) => {
            return {
              src: `data:${element.contentType};base64,${imageBuffer}`,
            };
          });
        }),
      }
    );

    let html = result.value || '';
    // Replace <img> tags with [Hình ảnh: data:...]
    html = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '\n[Hình ảnh: $1]\n');
    html = html.replace(/<u>(.*?)<\/u>/gi, "[U]$1[/U]");
    // Clean html tags to plain text lines
    html = html
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return html;
  } catch (err) {
    // Fallback to raw text extraction
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
}

/**
 * Helper to download sample format file (.txt or template instruction)
 */
export function downloadSampleFormatFile() {
  const blob = new Blob([SAMPLE_WORD_FORMAT], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'De_Thi_Mau_THPT_2027.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse raw text into array of Question items
 */
export function parseExamText(rawText: string): { questions: Question[]; errors: string[] } {
  const errors: string[] = [];
  const questions: Question[] = [];

  if (!rawText || rawText.trim().length === 0) {
    return { questions: [], errors: ['Nội dung file rỗng hoặc không có văn bản.'] };
  }

  // Normalize lines
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let currentSection: 'PART_I' | 'PART_II' | 'PART_III' = 'PART_I';

  // Group text into question raw blocks based on "Câu X" regex
  const questionBlocks: { id: number; section: 'PART_I' | 'PART_II' | 'PART_III'; lines: string[] }[] = [];
  let currentBlockLines: string[] = [];
  let currentQId = 0;

  for (const line of lines) {
    // Detect section headers
    if (/PHẦN\s+(I|1)\b/i.test(line)) {
      currentSection = 'PART_I';
      continue;
    } else if (/PHẦN\s+(II|2)\b/i.test(line)) {
      currentSection = 'PART_II';
      continue;
    } else if (/PHẦN\s+(III|3)\b/i.test(line)) {
      currentSection = 'PART_III';
      continue;
    }

    // Match "Câu 1." or "Câu 1:" or "Câu 1 "
    const qMatch = line.match(/^Câu\s*(\d+)[\.\:]?\s*(.*)/i);
    if (qMatch) {
      if (currentBlockLines.length > 0 && currentQId > 0) {
        questionBlocks.push({
          id: currentQId,
          section: currentSection,
          lines: [...currentBlockLines],
        });
      }
      currentQId = parseInt(qMatch[1], 10);
      
      // Auto deduce section from question ID if section headers weren't present
      if (currentQId >= 13 && currentQId <= 16) {
        currentSection = 'PART_II';
      } else if (currentQId >= 17) {
        currentSection = 'PART_III';
      } else if (currentQId <= 12) {
        currentSection = 'PART_I';
      }

      currentBlockLines = [line];
    } else {
      if (currentQId > 0) {
        currentBlockLines.push(line);
      }
    }
  }

  // Push last block
  if (currentBlockLines.length > 0 && currentQId > 0) {
    questionBlocks.push({
      id: currentQId,
      section: currentSection,
      lines: [...currentBlockLines],
    });
  }

  if (questionBlocks.length === 0) {
    errors.push('Không tìm thấy các câu hỏi theo định dạng "Câu 1.", "Câu 2.", ... trong file.');
    return { questions: [], errors };
  }

  // Parse each question block
  questionBlocks.forEach((block) => {
    try {
      const q = parseSingleQuestionBlock(block.id, block.section, block.lines);
      if (q) {
        questions.push(q);
      }
    } catch (e: any) {
      errors.push(`Lỗi khi xử lý Câu ${block.id}: ${e?.message || 'Không rõ nguyên nhân'}`);
    }
  });

  return { questions, errors };
}

function detectDiagramType(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('lăng trụ') || lower.includes('prism')) return 'PRISM';
  if (lower.includes('oxyz') || lower.includes('tọa độ điểm') || lower.includes('hình chiếu')) return 'OXYZ';
  if (lower.includes('đồ thị') || lower.includes('bảng biến thiên') || lower.includes('cực đại') || lower.includes('cực trị')) return 'GRAPH';
  if (lower.includes('mật thư') || lower.includes('cấp số cộng')) return 'TRIANGLE_SECRET';
  if (lower.includes('hình chóp s.abcd') || lower.includes('chóp s.abcd')) return 'PYRAMID_SABCD';
  if (lower.includes('hình chóp s.abc') || lower.includes('chóp s.abc')) return 'PYRAMID_SABC';
  return undefined;
}

function parseSingleQuestionBlock(
  id: number,
  section: 'PART_I' | 'PART_II' | 'PART_III',
  lines: string[]
): Question {
  const fullBlockText = lines.join('\n');

  // Check for explicit Image URL: [Hình ảnh: ...] or [Ảnh: ...] or ![...](...)
  let imageUrl: string | undefined = undefined;
  const imgMatch = fullBlockText.match(/(?:\[(?:Hình\s*ảnh|Ảnh|Hình|Image)\s*:\s*([^\]]+)\]|!\[[^\]]*\]\(([^\)]+)\))/i);
  if (imgMatch) {
    const rawUrl = (imgMatch[1] || imgMatch[2]).trim();
    if (rawUrl.startsWith('http') || rawUrl.startsWith('data:') || rawUrl.startsWith('/')) {
      imageUrl = rawUrl;
    }
  }

  // Check for explicit Diagram Type: [Hình vẽ: PRISM] or [Sơ đồ: OXYZ] or [Hình: GRAPH]
  let detectedDiagram = detectDiagramType(fullBlockText);
  const diagMatch = fullBlockText.match(/\[(?:Hình\s*vẽ|Sơ\s*đồ|Diagram|Mô\s*hình|Hình)\s*:\s*([A-Za-z0-9_]+)\]/i);
  if (diagMatch && !diagMatch[1].startsWith('http') && !diagMatch[1].startsWith('data:')) {
    detectedDiagram = diagMatch[1].toUpperCase();
  }

  // Clean tag lines from main text lines so they don't appear in the question body
  const cleanedLines = lines.map((l) =>
    l
      .replace(/(?:\[(?:Hình\s*ảnh|Ảnh|Hình|Image)\s*:\s*[^\]]+\]|!\[[^\]]*\]\([^\)]+\))/gi, '')
      .replace(/\[(?:Hình\s*vẽ|Sơ\s*đồ|Diagram|Mô\s*hình)\s*:\s*[A-Za-z0-9_]+\]/gi, '')
      .trim()
  ).filter((l) => l.length > 0);

  // Extract Explanation / Lời giải if present
  let explanation = 'Hướng dẫn giải chi tiết đang được cập nhật.';
  const explMatch = fullBlockText.match(/(?:Lời giải|Hướng dẫn giải|Giải|HDG)[\:\s]+([\s\S]*)$/i);
  let mainTextLines = cleanedLines.length > 0 ? [...cleanedLines] : [...lines];

  if (explMatch) {
    explanation = explMatch[1].trim();
    // cut explanation lines from main text lines
    const explIndex = mainTextLines.findIndex((l) => /^(?:Lời giải|Hướng dẫn giải|Giải|HDG)[\:\s]+/i.test(l));
    if (explIndex !== -1) {
      mainTextLines = mainTextLines.slice(0, explIndex);
    }
  }

  // Section title badge string
  let sectionTitle = 'PHẦN I: Trắc nghiệm (1-12)';
  if (section === 'PART_II') sectionTitle = 'PHẦN II: Đúng / Sai (13-16)';
  if (section === 'PART_III') sectionTitle = 'PHẦN III: Trả lời ngắn (17-22)';

  // Question Text (First line(s) before choices or answers)
  let qText = mainTextLines[0] ? mainTextLines[0].replace(/^Câu\s+\d+[\.\:]?\s*/i, '') : `Câu ${id}`;

  if (section === 'PART_I') {
    // Parse A, B, C, D choices
    const choices: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
    let correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A';

    const remainingLines = mainTextLines.slice(1);
    const textRemainderWithU = remainingLines.join(' ');
    const textRemainder = stripU(textRemainderWithU);

    const aMatch = textRemainder.match(/(?:^|\s)A[\.\)]\s*(.*?)(?=\s*(?:^|\s)B[\.\)]|$)/);
    const bMatch = textRemainder.match(/(?:^|\s)B[\.\)]\s*(.*?)(?=\s*(?:^|\s)C[\.\)]|$)/);
    const cMatch = textRemainder.match(/(?:^|\s)C[\.\)]\s*(.*?)(?=\s*(?:^|\s)D[\.\)]|$)/);
    const dMatch = textRemainder.match(/(?:^|\s)D[\.\)]\s*(.*?)(?=\s*(?:Đáp án|Lời giải|$))/i);

    choices.push({ key: 'A', text: stripU(aMatch ? aMatch[1].trim() : 'Đáp án A') });
    choices.push({ key: 'B', text: stripU(bMatch ? bMatch[1].trim() : 'Đáp án B') });
    choices.push({ key: 'C', text: stripU(cMatch ? cMatch[1].trim() : 'Đáp án C') });
    choices.push({ key: 'D', text: stripU(dMatch ? dMatch[1].trim() : 'Đáp án D') });

    const beforeAIndex = textRemainder.search(/(?:^|\s)A[\.\)]/);
    if (beforeAIndex > 0) {
      qText += ' ' + textRemainder.substring(0, beforeAIndex).trim();
    }

    const ansMatch = fullBlockText.match(/(?:Đáp án|Đáp án đúng|Chọn)[\:\s]+([A-D])/i);    if (ansMatch) {      correctAnswer = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";    } else {      let uMatch = fullBlockText.match(/\[U\]\s*([A-D])[\.\)]?\s*.*\[\/U\]/i) || fullBlockText.match(/\[U\]\s*([A-D])[\.\)]?\s*\[\/U\]/i);
      if (!uMatch) {
        const aIdx = textRemainderWithU.search(/(?:^|\s)A[\.\)]/);
        const bIdx = textRemainderWithU.search(/(?:^|\s)B[\.\)]/);
        const cIdx = textRemainderWithU.search(/(?:^|\s)C[\.\)]/);
        const dIdx = textRemainderWithU.search(/(?:^|\s)D[\.\)]/);
        const uIdx = textRemainderWithU.search(/\[U\]/i);
        if (uIdx !== -1) {
          if (dIdx !== -1 && uIdx > dIdx) uMatch = [null, "D"];
          else if (cIdx !== -1 && uIdx > cIdx) uMatch = [null, "C"];
          else if (bIdx !== -1 && uIdx > bIdx) uMatch = [null, "B"];
          else if (aIdx !== -1 && uIdx > aIdx) uMatch = [null, "A"];
        }
      }      if (uMatch) {        correctAnswer = uMatch[1].toUpperCase() as "A" | "B" | "C" | "D";      }    }

    return {
      id,
      section: 'PART_I',
      sectionTitle,
      questionText: stripU(qText.trim()),
      diagramType: detectedDiagram,
      imageUrl,
      options: choices,
      correctAnswer,
      explanation: stripU(explanation),
    };
  } else if (section === 'PART_II') {
    // Parse statements a), b), c), d)
    const statements: { key: 'a' | 'b' | 'c' | 'd'; text: string; correct: boolean }[] = [];
    const textRemainderWithU = mainTextLines.slice(1).join(' ');
    const textRemainder = stripU(textRemainderWithU);

    const beforeA = textRemainder.search(/(?:^|\s)a[\.\)]/i);
    if (beforeA > 0) {
      qText += ' ' + textRemainder.substring(0, beforeA).trim();
    }

    const ansMap: Record<string, boolean> = {};
    const globalAnsMatch = fullBlockText.match(/(?:Đáp án|ĐA)[\:\s]+(.*)/i);
    if (globalAnsMatch) {
      const ansStr = globalAnsMatch[1];
      const items = ansStr.split(/[,;\s]+/);
      items.forEach((item) => {
        const m = item.match(/([abcd])\s*[\:\-\=]?\s*(Đ|S|Đúng|Sai|true|false)/i);
        if (m) {
          const key = m[1].toLowerCase();
          const isTrue = /^(Đ|Đúng|true)$/i.test(m[2]);
          ansMap[key] = isTrue;
        }
      });
    }

    const keys: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];
    keys.forEach((k) => {
      const nextKey = k === 'a' ? 'b' : k === 'b' ? 'c' : k === 'c' ? 'd' : null;
      const regex = nextKey
        ? new RegExp(`(?:^|\\s)${k}[\\.\\)]\\s*(.*?)(?=\\s*(?:^|\\s)${nextKey}[\\.\\)]|$)`, 'i')
        : new RegExp(`(?:^|\\s)${k}[\\.\\)]\\s*(.*?)(?=\\s*(?:Đáp án|Lời giải|$))`, 'i');

      const match = textRemainder.match(regex);
      const matchWithU = textRemainderWithU.match(regex);
      let stmtText = match ? match[1].trim() : `Mệnh đề ${k}`;

      let isCorrect = ansMap[k];
      if (isCorrect === undefined) {
        // default based on underline presence if not specified in ansMap
        isCorrect = matchWithU ? /\[U\]/.test(matchWithU[0]) : false;
      }
      if (/(?:\[|\()?(?:Đúng|Đ|True)(?:\]|\)?)/i.test(stmtText)) {
        isCorrect = true;
        stmtText = stmtText.replace(/(?:\[|\()?(?:Đúng|Đ|True)(?:\]|\)?)/gi, "").trim();
      } else if (/(?:\[|\()?(?:Sai|S|False)(?:\]|\)?)/i.test(stmtText)) {
        isCorrect = false;
        stmtText = stmtText.replace(/(?:\[|\()?(?:Sai|S|False)(?:\]|\)?)/gi, "").trim();
      }


      statements.push({
        key: k,
        text: stripU(stmtText || `Mệnh đề ${k}`),
        correct: isCorrect,
      });
    });

    return {
      id,
      section: 'PART_II',
      sectionTitle,
      questionText: stripU(qText.trim()),
      diagramType: detectedDiagram,
      imageUrl,
      statements,
      explanation: stripU(explanation),
    };
  } else {
    // PART_III: Short answer


    let correctAnswer = '0';
    const textRemainderWithU = mainTextLines.slice(1).join(' ');
    const textRemainder = stripU(textRemainderWithU);
    qText = (qText + ' ' + textRemainder).trim();

    const ansMatch = fullBlockText.match(/(?:Đáp số|Đáp án|KQ|Kết quả)[\:\s]+([^\n\r]+)/i);
    if (ansMatch) {
      correctAnswer = stripU(ansMatch[1].trim());
      qText = qText.replace(/(?:Đáp số|Đáp án|KQ|Kết quả)[\:\s]+[^\n\r]+/gi, '').trim();
    }

    return {
      id,
      section: 'PART_III',
      sectionTitle,
      questionText: stripU(qText),
      diagramType: detectedDiagram,
      imageUrl,
      correctAnswer,
      explanation: stripU(explanation),
    };
  }
}

function stripU(text: string): string {
  if (!text) return text;
  return text.replace(/\[\/?U\]/gi, "");
}
