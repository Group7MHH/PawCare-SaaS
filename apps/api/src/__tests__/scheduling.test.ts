import {describe,it,expect} from 'vitest';
import {canTransition,validateBookingTime,sqlUTC,isoUTC} from '../lib/scheduling.js';
describe('Appointment domain rules',()=>{
 it('khách được hủy lịch chờ nhưng không tự hoàn thành',()=>{expect(canTransition('pending','cancelled','customer')).toBe(true);expect(canTransition('pending','completed','customer')).toBe(false);});
 it('Staff không thể xác nhận, hủy hay bỏ qua bước đang thực hiện',()=>{
  expect(canTransition('pending','confirmed','staff')).toBe(false);
  expect(canTransition('confirmed','cancelled','staff')).toBe(false);
  expect(canTransition('confirmed','completed','staff')).toBe(false);
  expect(canTransition('confirmed','in_progress','staff')).toBe(true);
  expect(canTransition('in_progress','completed','staff')).toBe(true);
 });
 it('Admin không thể bỏ qua bước thực hiện',()=>expect(canTransition('confirmed','completed','admin')).toBe(false));
 it('không thể mở lại lịch đã hủy',()=>expect(canTransition('cancelled','confirmed','admin')).toBe(false));
 it('từ chối đặt lịch trong quá khứ',()=>expect(()=>validateBookingTime(new Date('2020-01-01T02:00:00Z'),60,new Date('2026-01-01T00:00:00Z'))).toThrow());
 it('chấp nhận ca hợp lệ 09:00 thứ Hai ở Việt Nam',()=>expect(()=>validateBookingTime(new Date('2026-11-02T02:00:00Z'),60,new Date('2026-11-01T00:00:00Z'))).not.toThrow());
 it('từ chối Chủ nhật',()=>expect(()=>validateBookingTime(new Date('2026-11-01T02:00:00Z'),60,new Date('2026-10-31T00:00:00Z'))).toThrow());
 it('lưu UTC và chuyển UTC nhất quán',()=>expect(isoUTC(sqlUTC(new Date('2026-11-02T02:00:00Z')))).toBe('2026-11-02T02:00:00.000Z'));
});
