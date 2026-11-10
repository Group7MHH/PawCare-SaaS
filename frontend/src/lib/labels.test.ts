import {describe,expect,it} from 'vitest';
import {money,speciesName,statusName,dateOnly} from './api';
describe('UI helpers',()=>{
 it('định dạng tiền Việt Nam',()=>expect(money(180000)).toContain('180.000'));
 it('định dạng ngày ISO',()=>expect(dateOnly('2026-10-19')).toBe('19/10/2026'));
 it('hiển thị trạng thái',()=>expect(statusName.confirmed).toBe('Đã xác nhận'));
 it('tên loài hiển thị bằng chữ, không dùng emoji',()=>expect(speciesName('dog')).toBe('Chó'));
});
