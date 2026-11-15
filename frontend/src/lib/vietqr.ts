/**
 * VietQR Quick Link uses a documented BIN, bank account, amount and payment reference.
 * Generate only for recognized bank identifiers. Unknown names keep the manual
 * transfer instructions rather than showing an unscannable or misleading QR.
 * Source for BINs: https://www.vietqr.io/api-bank/demo
 */
const bankBins:Record<string,string>={
 VIETCOMBANK:'970436',VCB:'970436',NGOAI THUONG:'970436',
 VIETINBANK:'970415',ICB:'970415',CONG THUONG:'970415',
 BIDV:'970418',DAU TU VA PHAT TRIEN:'970418',
 AGRIBANK:'970405',VBA:'970405',NONG NGHIEP:'970405',
 MBBANK:'970422',MB:'970422',QUAN DOI:'970422',
 TECHCOMBANK:'970407',TCB:'970407',KY THUONG:'970407',
 ACB:'970416',A CHAU:'970416',
 VPBANK:'970432',VPB:'970432',VIET NAM THINH VUONG:'970432',
 TPBANK:'970423',TPB:'970423',TIEN PHONG:'970423',
 SACOMBANK:'970403',STB:'970403',SAI GON THUONG TIN:'970403',
 HDBANK:'970437',HDB:'970437',PHAT TRIEN THANH PHO HO CHI MINH:'970437',
 OCB:'970448',PHUONG DONG:'970448',
 SCB:'970429',SAI GON:'970429'
};
const compact=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'D').toUpperCase().replace(/[^A-Z0-9]/g,'');
const map=new Map(Object.entries(bankBins).map(([k,v])=>[compact(k),v]));
const recognizedBins=new Set(Object.values(bankBins));

export function resolveVietQrBin(bankName:string):string|null{
 const key=compact(bankName.trim());
 if(recognizedBins.has(key))return key;
 if(map.has(key))return map.get(key)!;
 // Allow "Ngân hàng TMCP MB Bank" and other common user-entered prefixes.
 const noPrefix=key.replace(/^(NGANHANG)?(THUONGMAICOPHAN|TMCP)?/,'');
 return map.get(noPrefix)??null;
}

export function buildVietQrUrl(bank:{name:string;account:string;owner:string},amount:number,reference:string):string|null{
 const bin=resolveVietQrBin(bank.name);
 const account=bank.account.trim();
 const owner=bank.owner.trim();
 if(!bin||!/^[0-9]{6,19}$/.test(account)||!owner||!Number.isSafeInteger(amount)||amount<=0||amount>9999999999999||!/^[A-Za-z0-9]{2,25}$/.test(reference))
  return null;
 const params=new URLSearchParams({amount:String(amount),addInfo:reference,accountName:owner});
 return `https://img.vietqr.io/image/${bin}-${account}-compact2.png?${params.toString()}`;
}
