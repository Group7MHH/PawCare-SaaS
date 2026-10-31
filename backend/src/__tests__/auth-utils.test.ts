import {describe,it,expect} from 'vitest';
import {hashToken} from '../lib/auth.js';
describe('Session security',()=>{
 it('hash token session trước khi lưu',()=>{const token='a'.repeat(64);const digest=hashToken(token);expect(digest).toHaveLength(64);expect(digest).not.toBe(token);expect(hashToken(token)).toBe(digest);});
 it('hai token khác nhau có hash khác nhau',()=>expect(hashToken('abc')).not.toBe(hashToken('xyz')));
});
