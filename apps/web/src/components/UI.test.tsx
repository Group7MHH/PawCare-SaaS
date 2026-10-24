import {describe,expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import {Badge,Empty} from './UI';
describe('Shared UI',()=>{
 it('hiển thị tên trạng thái tiếng Việt',()=>{render(<Badge status="confirmed"/>);expect(screen.getByText('Đã xác nhận')).toBeTruthy();});
 it('có empty state rõ ràng',()=>{render(<Empty title="Chưa có dữ liệu"/>);expect(screen.getByText('Chưa có dữ liệu')).toBeTruthy();});
});
