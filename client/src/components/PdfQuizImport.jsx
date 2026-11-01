import {useEffect,useRef,useState} from 'react';
import {apiFetch} from '../services/api';

export default function PdfQuizImport({onBack,onSaved}) {
  const [questions,setQuestions]=useState([]),[title,setTitle]=useState(''),[progress,setProgress]=useState(''),[error,setError]=useState(''),[warnings,setWarnings]=useState([]),[reviewed,setReviewed]=useState(false),[source,setSource]=useState(''),[busy,setBusy]=useState(false);
  const active=useRef(true),url=useRef('');
  useEffect(()=>{active.current=true;return()=>{active.current=false;if(url.current)URL.revokeObjectURL(url.current);};},[]);
  const update=(index,change)=>{setReviewed(false);setQuestions(qs=>qs.map((q,i)=>i===index?{...q,...change}:q));};
  async function read(file){
    if(!file)return;
    setBusy(true);setError('');setQuestions([]);setReviewed(false);setWarnings([]);
    try{
      const {importQuizPdf}=await import('../services/pdfImport');
      const result=await importQuizPdf(file,s=>{if(active.current)setProgress(s);});
      if(!active.current)return;
      if(url.current)URL.revokeObjectURL(url.current);
      url.current=URL.createObjectURL(file);setSource(url.current);
      setTitle(file.name.replace(/\.pdf$/i,'').slice(0,200));setQuestions(result.questions);setWarnings(result.warnings);
    }catch(e){if(active.current)setError(e.message||'Không đọc được PDF.');}
    finally{if(active.current){setBusy(false);setProgress('');}}
  }
  const invalid=questions.filter(q=>!q.question.trim()||q.question.length>10000||q.options.length!==4||q.options.some(o=>!o.text.trim()||o.text.length>5000)||q.options.filter(o=>o.isCorrect).length!==1).length;
  async function save(openRoom){
    setBusy(true);setError('');
    try{
      const response=await apiFetch((import.meta.env.VITE_BACKEND_URL||'')+'/api/quizzes/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,questions:questions.map(q=>({type:q.type,question:q.question,imageUrl:q.imageUrl,timeLimit:q.timeLimit,points:q.points,options:q.options})),showQuestionsOnPlayerScreen:true})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Chưa lưu được bộ đề.');
      onSaved(data,openRoom);
    }catch(e){setError(e.message);}finally{if(active.current)setBusy(false);}
  }
  const input='w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:outline-blue-500';
  return <div className="bg-[#f0f4f9] min-h-screen p-4 sm:p-8 select-text"><div className="max-w-4xl mx-auto space-y-5">
    <button onClick={onBack} disabled={busy} className="text-blue-800 font-bold disabled:opacity-50">← Về bộ đề của tôi</button>
    <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <h1 className="text-2xl font-black text-[#002855]">Tạo quiz từ PDF</h1>
      <p>Nhập câu trắc nghiệm A/B/C/D từ PDF có chữ. Tự nhận đáp án nếu được ghi sau câu hỏi; bạn có thể sửa trước khi mở phòng.</p>
      <label className="block font-bold" htmlFor="pdf-file">Chọn file PDF (tối đa 20 MB, 60 trang, 100 câu)</label>
      <input id="pdf-file" type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e=>{read(e.target.files?.[0]);e.target.value='';}} className="block w-full file:bg-blue-50 file:text-blue-800 file:rounded-lg file:border-0 file:p-3 file:mr-3" />
      <p className="text-sm text-gray-600">PDF scan cần OCR trước. Hỗ trợ tiêu đề “Câu 1”, “Câu hỏi 1”, “Question 1” hoặc “1.” và lựa chọn a./b./c./d. File gốc không được gửi lên máy chủ.</p>
      {progress&&<p role="status" className="text-blue-700">{progress}</p>}
      {error&&<p role="alert" className="bg-red-50 text-red-800 p-3 rounded-lg">{error}</p>}
    </section>
    {!!questions.length&&<>
      <section className="bg-white rounded-2xl p-6 space-y-3">
        <h2 className="text-xl font-bold">Xem lại {questions.length} câu hỏi</h2>
        {warnings.map(w=><p key={w} className="text-sm text-amber-900 bg-amber-50 rounded p-3">{w}</p>)}
        <a href={source} target="_blank" rel="noreferrer" className="text-blue-700 underline inline-block">Mở PDF gốc để đối chiếu</a>
        <label className="block font-bold" htmlFor="pdf-title">Tên bộ đề</label>
        <input id="pdf-title" className={input} value={title} maxLength={200} onChange={e=>setTitle(e.target.value)} />
      </section>
      <fieldset disabled={busy} className="space-y-4">
        {questions.map((q,i)=><section key={q.id} className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex justify-between gap-3"><h3 className="font-bold text-blue-900">Câu {i+1} · Trang {q.sourcePage}</h3><button type="button" className="text-red-700" onClick={()=>{setQuestions(qs=>qs.filter((_,j)=>j!==i));setReviewed(false);}}>Bỏ câu {i+1}</button></div>
          {q.issues.map(msg=><p key={msg} className="text-sm text-amber-800">Lưu ý khi nhập: {msg}</p>)}
          <label className="block text-sm font-bold" htmlFor={`q-${q.id}`}>Nội dung câu {i+1}</label>
          <textarea id={`q-${q.id}`} className={input} rows={3} value={q.question} onChange={e=>update(i,{question:e.target.value})} />
          {q.imageUrl&&<div><img src={q.imageUrl} alt={`Hình minh họa câu ${i+1}`} className="max-h-80 max-w-full object-contain mx-auto"/><button type="button" className="text-sm text-red-700" onClick={()=>update(i,{imageUrl:''})}>Bỏ hình này</button></div>}
          <p className="text-sm font-bold">Chọn một đáp án đúng:</p>
          {q.options.map((o,j)=><div key={j} className="flex items-start gap-2">
            <input type="radio" name={`answer-${q.id}`} aria-label={`Câu ${i+1}: đáp án ${String.fromCharCode(65+j)} đúng`} checked={o.isCorrect} onChange={()=>update(i,{options:q.options.map((x,k)=>({...x,isCorrect:k===j}))})} className="mt-4" />
            <textarea aria-label={`Câu ${i+1}: lựa chọn ${String.fromCharCode(65+j)}`} rows={2} className={input} value={o.text} onChange={e=>update(i,{options:q.options.map((x,k)=>k===j?{...x,text:e.target.value}:x)})}/>
            <button type="button" aria-label={`Xóa lựa chọn ${j+1} câu ${i+1}`} onClick={()=>update(i,{options:q.options.filter((_,k)=>k!==j)})} className="p-3 text-red-700">×</button>
          </div>)}
          {q.options.length<4&&<button type="button" className="text-blue-700 font-bold" onClick={()=>update(i,{options:[...q.options,{id:q.options.length,text:'',isCorrect:false}]})}>+ Thêm lựa chọn</button>}
          <label className="flex items-center gap-3 text-sm">Thời gian trả lời <select value={q.timeLimit} onChange={e=>update(i,{timeLimit:Number(e.target.value)})} className="p-2 border rounded">{[15,30,60,120,300].map(n=><option key={n} value={n}>{n} giây</option>)}</select></label>
        </section>)}
      </fieldset>
      <section className="bg-white rounded-2xl p-6 space-y-4 border-t-4 border-blue-600">
        <p role="status">{invalid?`${invalid} câu cần sửa nội dung, đủ 4 lựa chọn và chọn một đáp án đúng.`:'Các câu đã đủ nội dung và đáp án.'}</p>
        <label className="flex gap-3 items-start"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)} className="mt-1"/>Tôi đã đối chiếu nội dung, hình minh họa và đáp án với PDF gốc.</label>
        <div className="flex flex-wrap gap-3">{[false,true].map(open=><button key={String(open)} onClick={()=>save(open)} disabled={busy||!reviewed||invalid>0||!title.trim()} className="bg-[#0275b8] text-white px-5 py-3 rounded-lg font-bold disabled:opacity-40">{busy?'Đang xử lý…':open?'Tạo đề và mở phòng':'Lưu bộ đề'}</button>)}</div>
      </section>
    </>}
  </div></div>;
}
