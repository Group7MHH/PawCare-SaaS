import {describe,expect,it} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {Badge,Empty,Modal} from './UI';
describe('Shared UI',()=>{
 it('hiển thị tên trạng thái tiếng Việt',()=>{render(<Badge status="confirmed"/>);expect(screen.getByText('Đã xác nhận')).toBeTruthy();});
 it('có empty state rõ ràng',()=>{render(<Empty title="Chưa có dữ liệu"/>);expect(screen.getByText('Chưa có dữ liệu')).toBeTruthy();});
});

describe('Shared modal viewport',()=>{
 it('renders outside animated page ancestors and restores scroll on unmount',()=>{
  const previous=document.body.style.overflow;
  const view=render(<div style={{transform:'translateY(10px)'}}><Modal title="Thêm thú cưng" onClose={()=>{}}><input aria-label="Tên thú cưng"/></Modal></div>);
  const dialog=screen.getByRole('dialog',{name:'Thêm thú cưng'});
  expect(dialog.parentElement?.parentElement).toBe(document.body);
  expect(view.container.contains(dialog)).toBe(false);
  expect(document.body.style.overflow).toBe('hidden');
  view.unmount();
  expect(document.body.style.overflow).toBe(previous);
 });
 it('closes on Escape and on a backdrop click',()=>{
  let closed=0;
  const view=render(<Modal title="Hồ sơ" onClose={()=>{closed++;}}><input aria-label="Tên"/></Modal>);
  fireEvent.keyDown(document,{key:'Escape'});
  fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
  expect(closed).toBe(2);
  view.unmount();
 });
});
