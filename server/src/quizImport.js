import { randomUUID } from 'node:crypto';

export const MAX_IMPORT_IMAGE_LENGTH = 750 * 1024;

function fail(message) {
  throw new Error(message);
}

function text(value, label, maxLength, allowEmpty = false) {
  if (typeof value !== 'string' || value.length > maxLength || (!allowEmpty && !value.trim())) {
    fail(`${label} phải ${allowEmpty ? '' : 'có nội dung và '}không quá ${maxLength} ký tự.`);
  }
  return value.trim();
}

function image(value, label) {
  if (value === undefined || value === '') return '';
  if (typeof value !== 'string' || value.length > MAX_IMPORT_IMAGE_LENGTH) {
    fail(`${label}: ảnh phải nhỏ hơn 750 KB.`);
  }
  const prefix = /^data:image\/(png|jpeg|webp);base64,/.exec(value);
  if (!prefix) fail(`${label}: chỉ nhận ảnh PNG, JPEG hoặc WebP được nhúng trong bộ đề.`);
  const encoded = value.slice(prefix[0].length);
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) ||
      Buffer.from(encoded, 'base64').toString('base64') !== encoded) {
    fail(`${label}: dữ liệu ảnh không hợp lệ.`);
  }
  return value;
}

// Accept only the fields needed to play. PDF page metadata, account details and
// client-supplied ownership must never become part of the persisted quiz.
export function validateImportedQuiz(body, ownerId) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Bộ đề nhập không hợp lệ.');
  const title = text(body.title, 'Tên bộ đề', 200);
  const description = text(body.description ?? '', 'Mô tả', 2000, true);
  if (!Array.isArray(body.questions) || body.questions.length < 1 || body.questions.length > 100) {
    fail('Bộ đề phải có từ 1 đến 100 câu hỏi.');
  }
  const questions = body.questions.map((q, index) => {
    const label = `Câu ${index + 1}`;
    if (!q || typeof q !== 'object' || Array.isArray(q)) fail(`${label}: dữ liệu câu hỏi không hợp lệ.`);
    if (!['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(q.type)) fail(`${label}: dạng câu hỏi chưa được hỗ trợ.`);
    const count = q.type === 'TRUE_FALSE' ? 2 : 4;
    if (!Array.isArray(q.options) || q.options.length !== count) fail(`${label}: cần đúng ${count} lựa chọn.`);
    const options = q.options.map((option, optionIndex) => {
      if (!option || typeof option !== 'object' || typeof option.isCorrect !== 'boolean') {
        fail(`${label}: hãy xác định đáp án đúng cho từng lựa chọn.`);
      }
      return {
        id: optionIndex,
        text: text(option.text, `${label}, lựa chọn ${optionIndex + 1}`, 5000),
        isCorrect: option.isCorrect
      };
    });
    if (options.filter((option) => option.isCorrect).length !== 1) fail(`${label}: phải có đúng một đáp án đúng.`);
    if (!Number.isInteger(q.timeLimit) || q.timeLimit < 10 || q.timeLimit > 300) {
      fail(`${label}: thời gian trả lời phải từ 10 đến 300 giây.`);
    }
    if (![1000, 2000].includes(q.points)) fail(`${label}: điểm phải là 1000 hoặc 2000.`);
    return {
      id: `q_${randomUUID()}`,
      type: q.type,
      question: text(q.question, label, 10000),
      imageUrl: image(q.imageUrl, label),
      timeLimit: q.timeLimit,
      points: q.points,
      options
    };
  });
  return {
    id: `quiz_${randomUUID()}`,
    userId: ownerId,
    title,
    description,
    coverImage: '/hcmut-campus-background.png',
    showQuestionsOnPlayerScreen: body.showQuestionsOnPlayerScreen !== false,
    questions
  };
}
