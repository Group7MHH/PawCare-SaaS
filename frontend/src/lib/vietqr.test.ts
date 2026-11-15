import {describe,it,expect} from 'vitest';
import {resolveVietQrBin,buildVietQrUrl} from './vietqr';

describe('VietQR Quick Link generation',()=>{
 it('maps common supported banks and BINs',()=>{
  expect(resolveVietQrBin('MB Bank')).toBe('970422');
  expect(resolveVietQrBin('Vietcombank')).toBe('970436');
  expect(resolveVietQrBin('Ngân hàng TMCP MB Bank')).toBe('970422');
  expect(resolveVietQrBin('970407')).toBe('970407');
  expect(resolveVietQrBin('An unknown bank')).toBeNull();
 });
 it('includes exact amount, bank account and payment reference',()=>{
  const src=buildVietQrUrl({name:'MB Bank',account:'0123456789',owner:'NGUYEN VAN AN'},350000,'PC00000123');
  expect(src).not.toBeNull();
  const url=new URL(src!);
  expect(url.origin).toBe('https://img.vietqr.io');
  expect(url.pathname).toBe('/image/970422-0123456789-compact2.png');
  expect(url.searchParams.get('amount')).toBe('350000');
  expect(url.searchParams.get('addInfo')).toBe('PC00000123');
  expect(url.searchParams.get('accountName')).toBe('NGUYEN VAN AN');
 });
 it('never constructs a QR from an unknown bank or invalid amount/account/reference',()=>{
  const recipient={name:'MB Bank',account:'0123456789',owner:'NGUYEN VAN AN'};
  expect(buildVietQrUrl({...recipient,name:'Nonexistent'},350000,'PC0001')).toBeNull();
  expect(buildVietQrUrl({...recipient,account:'abc'},350000,'PC0001')).toBeNull();
  expect(buildVietQrUrl(recipient,-1,'PC0001')).toBeNull();
  expect(buildVietQrUrl(recipient,12.5,'PC0001')).toBeNull();
  expect(buildVietQrUrl(recipient,200000,'message with spaces')).toBeNull();
 });
});
