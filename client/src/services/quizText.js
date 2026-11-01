const clean = s => s.normalize('NFC').replace(/[✓✔☑✗✘⌃]/g, '').replace(/\s+×\s*$/, '').replace(/\s+/g, ' ').trim();
const key = s => clean(s).toLocaleLowerCase('vi');

// Keep character fragments together: Vietnamese glyphs are often separate PDF text items.
export function textLines(items, page) {
  const rows = [];
  for (const item of [...items].sort((a,b) => a.y-b.y || a.x-b.x)) {
    let row = rows.find(r => Math.abs(r.y-item.y) < 2);
    if (!row) { row = {page,y:item.y,parts:[]}; rows.push(row); }
    row.parts.push(item);
  }
  return rows.map(row => {
    let text='', right=0;
    for (const part of row.parts.sort((a,b)=>a.x-b.x)) {
      if (text && part.x-right > Math.max(1,part.height*.15)) text+=' ';
      text+=part.text; right=part.x+part.width;
    }
    return {page,y:row.y,text:clean(text)};
  }).filter(r=>r.text);
}

export function parseQuizLines(lines) {
  const questions=[]; let q=null, option=null, answer=false;
  const finish=()=>{
    if (!q) return;
    q.question=clean(q.prompt.join(' '));
    q.options=q.options.map((o,id)=>({id,text:clean(o.text),isCorrect:false}));
    const correct=key(q.answer.join(' ')).replace(/[.!]$/, '');
    const letter=/^(?:[a-z]|[a-z][.)])$/i.test(correct) ? correct[0].charCodeAt(0)-97 : -1;
    const matches=q.options.map((o,i)=>key(o.text).replace(/[.!]$/, '')===correct || i===letter);
    if(correct && matches.filter(Boolean).length===1) q.options[matches.indexOf(true)].isCorrect=true;
    q.issues=[];
    if(!q.options.some(o=>o.isCorrect))q.issues.push('Chưa xác định được đáp án đúng. Hãy chọn lại.');
    if(q.options.length!==4)q.issues.push(`Nhận được ${q.options.length} lựa chọn; cần chỉnh thành 4 lựa chọn.`);
    if(!q.question)q.issues.push('Chưa đọc được nội dung câu hỏi.');
    delete q.prompt;delete q.answer;
    questions.push(q);
  };
  for(const line of lines){
    const s=line.text;
    if(/^https?:\/\/|Xem lại lần làm thử|Review of attempt|^\d+\s*\/\s*\d+$/.test(s))continue;
    const heading=/^(?:Câu(?:\s+hỏi)?|Question)\s*(\d+)\s*[:.)-]?\s*(.*)$/iu.exec(s) || /^(\d+)[.)]\s+(.+)$/.exec(s);
    if(heading){
      finish();q={id:`pdf_${questions.length}`,type:'MULTIPLE_CHOICE',sourceNumber:Number(heading[1]),sourcePage:line.page,startY:line.y,firstOption:null,question:'',prompt:[heading[2]],answer:[],options:[],imageUrl:'',timeLimit:30,points:1000};option=null;answer=false;continue;
    }
    if(!q)continue;
    const ans=/^(?:The correct answer is|Correct answer|Đáp án(?: đúng)?|Câu trả lời đúng(?: là)?)\s*[:：]\s*(.*)$/iu.exec(s);
    if(ans){answer=true;option=null;q.answer.push(ans[1]);continue;}
    if(/^(?:Đúng(?: một phần)?|Sai|Correct|Incorrect|Not answered|Chưa trả lời)$/iu.test(s)||/^(?:Đạt điểm|Marked out of|Mark |Select one|Select all|Chọn một|Câu trả lời của bạn|Your answer)/iu.test(s))continue;
    if(answer){q.answer.push(s);continue;}
    const choice=/^([a-z])[.)]\s*(.*)$/i.exec(s);
    if(choice){option={text:choice[2]};q.options.push(option);q.firstOption??={page:line.page,y:line.y};continue;}
    if(option)option.text+=' '+s;else q.prompt.push(s);
  }
  finish();
  return questions;
}
