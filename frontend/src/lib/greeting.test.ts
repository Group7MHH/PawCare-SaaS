import {describe,expect,it} from 'vitest';
import {greeting} from './greeting';

const vnTime=(hour:number)=>new Date(Date.UTC(2026,10,17,hour-7,0,0));
describe('Vietnamese greeting uses Asia/Ho_Chi_Minh time',()=>{
 it.each([
  [0,'Chào buổi sáng'],
  [6,'Chào buổi sáng'],
  [10,'Chào buổi sáng'],
  [11,'Chào buổi trưa'],
  [13,'Chào buổi trưa'],
  [14,'Chào buổi chiều'],
  [17,'Chào buổi chiều'],
  [18,'Chào buổi tối'],
  [23,'Chào buổi tối']
 ])('at %i:00 Vietnam time shows %s',(hour,expected)=>{
  expect(greeting(vnTime(hour))).toBe(expected);
 });
 it('does not misparse the Vietnamese hour suffix',()=>{
  const hourLabel=new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',hourCycle:'h23',timeZone:'Asia/Ho_Chi_Minh'}).format(vnTime(7));
  expect(hourLabel).toContain('giờ');
  expect(greeting(vnTime(7))).toBe('Chào buổi sáng');
 });
});
