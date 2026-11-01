import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQuizLines,textLines} from '../../client/src/services/quizText.js';
import {validateImportedQuiz} from '../src/quizImport.js';

const parse = text => parseQuizLines(text.split('\n').map((text,i)=>({text,page:1,y:i*10})));
const fixture=`Câu 1: Chọn số chẵn\nA. 1\nB. 2\nC. 3\nD. 5\nĐáp án: B\nQuestion 2\nPick a color\na. Red\nb. Blue\nc. Green\nd. White\nThe correct answer is: Blue`;
test('generic Vietnamese and English questions use explicit answers',()=>{
 const qs=parse(fixture);assert.equal(qs.length,2);assert.equal(qs[0].question,'Chọn số chẵn');assert.equal(qs[0].options[1].isCorrect,true);assert.equal(qs[1].options[1].isCorrect,true);
});
test('missing answers, unsupported option counts and ambiguous answers require review',()=>{
 const qs=parse('1. Choose\nA. Same\nB. Same\nC. Other\nĐáp án: Same');assert.equal(qs[0].options.length,3);assert.ok(qs[0].options.every(o=>!o.isCorrect));assert.equal(qs[0].issues.length,2);
 assert.ok(parse('Câu 1\nQuestion text\na. One\nb. Two\nc. Three\nd. Four')[0].options.every(o=>!o.isCorrect));
});
test('page breaks and LMS review marks do not replace the answer key',()=>{
 const lines=['Câu hỏi 1','Sai','Đạt điểm 0,00 trên 1,00','Pick one','a. First ×','b. Second','https://example.com 1/2','c. Third','d. Fourth','Your answer is incorrect.','The correct answer is:','Second'].map((text,i)=>({text,page:i<6?1:2,y:i*10}));
 const q=parseQuizLines(lines)[0];assert.equal(q.options[0].text,'First');assert.equal(q.options[1].isCorrect,true);
});
test('fragmented Vietnamese PDF text is joined without splitting glyphs',()=>{
 const lines=textLines([{text:'Câu h',x:0,y:10,width:20,height:8},{text:'ỏi',x:20,y:10,width:5,height:8},{text:'1',x:28,y:10,width:4,height:8}],1);assert.equal(lines[0].text,'Câu hỏi 1');
});
test('server import assigns ownership and strips source metadata',()=>{
 const quiz=validateImportedQuiz({title:' Quiz ',userId:'forged',questions:parse(fixture)},'owner');assert.equal(quiz.userId,'owner');assert.equal(quiz.title,'Quiz');assert.equal(quiz.questions[0].sourcePage,undefined);assert.deepEqual(quiz.questions[0].options.map(o=>o.id),[0,1,2,3]);
});
test('server refuses incomplete and invalid imported questions',()=>{
 for(const mutate of [q=>q.options.forEach(o=>o.isCorrect=false),q=>q.options.forEach(o=>o.isCorrect=true),q=>q.options.pop(),q=>q.question='',q=>q.timeLimit=0,q=>q.type='ESSAY',q=>q.imageUrl='javascript:alert(1)']){
   const questions=parse(fixture);mutate(questions[0]);assert.throws(()=>validateImportedQuiz({title:'Test',questions},'owner'));
 }
 assert.throws(()=>validateImportedQuiz({title:'',questions:parse(fixture)},'owner'));
 assert.throws(()=>validateImportedQuiz({title:'Test',questions:[]},'owner'));
});
