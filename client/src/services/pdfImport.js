import {getDocument,GlobalWorkerOptions,OPS,Util} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {textLines,parseQuizLines} from './quizText';
GlobalWorkerOptions.workerSrc=workerUrl;

export async function importQuizPdf(file,onProgress=()=>{}) {
  if(file.size>20*1024*1024)throw new Error('Chọn PDF không quá 20 MB.');
  const data=new Uint8Array(await file.arrayBuffer());
  if(!new TextDecoder().decode(data.slice(0,1024)).includes('%PDF-'))throw new Error('File này không phải PDF hợp lệ.');
  const task=getDocument({data,isEvalSupported:false});
  try{
    const pdf=await task.promise;
    if(pdf.numPages>60)throw new Error('Bản nhập hiện hỗ trợ tối đa 60 trang. Hãy chia nhỏ PDF.');
    const pages=[],lines=[];
    for(let n=1;n<=pdf.numPages;n++){
      onProgress(`Đang đọc trang ${n}/${pdf.numPages}…`);
      const page=await pdf.getPage(n),vp=page.getViewport({scale:1}),content=await page.getTextContent();
      const items=content.items.filter(i=>i.str?.trim()).map(i=>{
        const t=Util.transform(vp.transform,i.transform);
        return {text:i.str,x:t[4],y:t[5],width:i.width,height:i.height};
      });
      lines.push(...textLines(items,n));pages.push(page);
    }
    const questions=parseQuizLines(lines);
    if(!questions.length)throw new Error('Chưa nhận diện được câu hỏi. Hỗ trợ PDF có chữ với “Câu 1”, “Question 1” hoặc “1.” và lựa chọn A/B/C/D. PDF scan cần chuyển sang chữ (OCR) trước.');
    if(questions.length>100)throw new Error('Có hơn 100 câu hỏi. Hãy chia nhỏ bộ đề.');
    // Crop only embedded illustrations located before the options, never review answers.
    for(let n=1;n<=pages.length;n++){
      onProgress(`Đang lấy hình trang ${n}/${pages.length}…`);
      const page=pages[n-1],vp=page.getViewport({scale:1}),ops=await page.getOperatorList();
      let matrix=[1,0,0,1,0,0];const stack=[],regions=[];
      for(let i=0;i<ops.fnArray.length;i++){
        const op=ops.fnArray[i],args=ops.argsArray[i];
        if(op===OPS.save)stack.push(matrix.slice());
        else if(op===OPS.restore)matrix=stack.pop()||[1,0,0,1,0,0];
        else if(op===OPS.transform)matrix=Util.transform(matrix,args);
        else if([OPS.paintImageXObject,OPS.paintInlineImageXObject].includes(op)){
          const t=Util.transform(vp.transform,matrix),corners=[[0,0],[0,1],[1,0],[1,1]];
          corners.forEach(p=>Util.applyTransform(p,t));
          const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
          const rect={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
          const q=questions.find(q=>q.sourcePage===n&&q.firstOption?.page===n&&rect.y>q.startY&&rect.y+rect.h<q.firstOption.y-2);
          if(q&&rect.w>20&&rect.h>20)regions.push({q,rect});
        }
      }
      if(regions.length){
        const scale=Math.min(2,1600/vp.width),canvas=document.createElement('canvas'),view=page.getViewport({scale});
        canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
        await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;
        for(const q of new Set(regions.map(r=>r.q))){
          const rs=regions.filter(r=>r.q===q).map(r=>r.rect),x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));
          const w=Math.max(...rs.map(r=>r.x+r.w))-x,h=Math.max(...rs.map(r=>r.y+r.h))-y;
          const crop=document.createElement('canvas');crop.width=Math.ceil(w*scale);crop.height=Math.ceil(h*scale);
          crop.getContext('2d').drawImage(canvas,x*scale,y*scale,w*scale,h*scale,0,0,crop.width,crop.height);
          q.imageUrl=crop.toDataURL('image/jpeg',.85);
          if(q.imageUrl.length>750*1024){q.imageUrl='';q.issues.push('Hình quá lớn; hãy kiểm tra và bổ sung hình sau.');}
          crop.width=crop.height=0;
        }
        canvas.width=canvas.height=0;
      }
      page.cleanup();
    }
    return {questions,pageCount:pdf.numPages,warnings:['Kiểm tra lại nội dung, hình/công thức và đáp án với PDF gốc. Bố cục nhiều cột, hình vector và đáp án ở bảng cuối file có thể cần chỉnh thủ công.']};
  }catch(error){
    if(error.name==='PasswordException')throw new Error('PDF có mật khẩu. Hãy mở khóa file trước khi nhập.');
    throw error;
  }finally{await task.destroy();}
}
