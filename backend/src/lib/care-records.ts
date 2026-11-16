/** Group finished services by their actual purpose, not by a blanket grooming label. */
export type CareRecordCategory='vaccination'|'medical'|'grooming'|'other';
export type CareService={name:string;category?:string|null};

function normalize(value:string):string{
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
}
function classifyLabel(value:string):CareRecordCategory{
 const label=normalize(value);
 if(/tiem|vaccin|vaccine|chung ngua|immuniz/.test(label))return 'vaccination';
 if(/kham|suc khoe|dieu tri|chua benh|xet nghiem|chan doan|nha khoa|rang mieng|cao voi|dental|medical|check.?up|vet clinic/.test(label))return 'medical';
 if(/tam|spa|cat tia|tia long|groom|ve sinh|cham soc long|cat mong|ve sinh tai|lam dep|massage/.test(label))return 'grooming';
 return 'other';
}
export function classifyCareService(service:CareService):CareRecordCategory{
 const fromName=classifyLabel(service.name);
 return fromName==='other'?classifyLabel(service.category||''):fromName;
}
export function classifyAppointmentCare(services:CareService[]):CareRecordCategory{
 if(!services.length)return 'other';
 const types=services.map(classifyCareService);
 return types.every(type=>type===types[0])?types[0]:'other';
}
