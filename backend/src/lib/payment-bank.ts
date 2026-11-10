import {rows,type DB} from './db.js';

export type BankRecipient={name:string;account:string;owner:string};
export type BankSettings={bank:BankRecipient|null;enabled:boolean;source:'database'|'environment'|'none'};

export async function getBankSettings(org:number,db?:DB):Promise<BankSettings>{
 const [setting]=await rows<{bank_name:string;bank_account:string;bank_owner:string;enabled:boolean}>(
  'SELECT bank_name,bank_account,bank_owner,enabled FROM payment_bank_settings WHERE organization_id=?',
  [org],db);
 if(setting){
  return {source:'database',enabled:setting.enabled,
   bank:{name:setting.bank_name,account:setting.bank_account,owner:setting.bank_owner}};
 }
 const name=(process.env.PAYMENT_BANK_NAME||'').trim();
 const account=(process.env.PAYMENT_BANK_ACCOUNT||'').trim();
 const owner=(process.env.PAYMENT_BANK_OWNER||'').trim();
 if(name&&account&&owner)return {source:'environment',enabled:true,bank:{name,account,owner}};
 return {source:'none',enabled:false,bank:null};
}
/** Only enabled bank recipients can be offered to customers. */
export async function getActiveBank(org:number,db?:DB):Promise<BankRecipient|null>{
 const setting=await getBankSettings(org,db);
 return setting.enabled?setting.bank:null;
}
