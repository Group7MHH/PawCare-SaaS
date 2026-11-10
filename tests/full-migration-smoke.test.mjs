import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migrations=Array.from({length:13},(_,i)=>String(i+1).padStart(3,'0'));
const list=[
'001_postgres_schema.sql','002_default_services.sql','003_owner_multitenant.sql',
'004_single_store.sql','005_completed_revenue.sql','006_multi_service_appointments.sql',
'007_staff_assignment.sql','008_staff_self_service_queue.sql','009_manual_payments.sql',
'010_payment_bank_settings.sql','011_staff_payment_reconciliation.sql',
'012_service_name_snapshot.sql','013_awaiting_bank_payment.sql'
];
test('Full PostgreSQL migration smoke test with immutable service/payment history',
 {skip:!process.env.TEST_DATABASE_URL},async()=>{
 const url=new URL(process.env.TEST_DATABASE_URL);
 assert.match(decodeURIComponent(url.pathname),/test/i);
 assert.notEqual(process.env.TEST_DATABASE_URL,process.env.DATABASE_URL);
 const {default:pg}=await import('pg');
 const schema='pawcare_workflow_'+process.pid+'_'+Date.now();
 const admin=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
 await admin.connect();
 try{
  await admin.query('CREATE SCHEMA "'+schema+'"');
  const db=new pg.Client({
   connectionString:process.env.TEST_DATABASE_URL,
   options:'-c search_path='+schema+' -c timezone=UTC'
  });
  await db.connect();
  try{
   for(const filename of list){
    const sql=readFileSync(new URL('../database/'+filename,import.meta.url),'utf8');
    if(sql.trim())await db.query(sql);
   }
   for(const column of ['name_snapshot']){
    const r=await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3',[schema,'appointment_services',column]);
    assert.equal(r.rowCount,1);
   }
   const org=(await db.query('SELECT id FROM organizations LIMIT 1')).rows[0].id;
   const newUser=async(name,role)=>(
    await db.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',
     [name,name.toLowerCase().replaceAll(' ','')+'@example.test','hash',role])
   ).rows[0].id;
   const adminId=await newUser('Admin Workflow','admin');
   const customer=await newUser('Customer Workflow','customer');
   const staff=await newUser('Staff Workflow','staff');
   await db.query('INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,$3)',[org,staff,'staff']);
   const service=(await db.query('INSERT INTO services(organization_id,name,category,description,duration_minutes,price) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[org,'Tắm và vệ sinh','SPA','Care',60,200000])).rows[0].id;
   const pet=(await db.query('INSERT INTO pets(owner_id,name,species) VALUES($1,$2,$3) RETURNING id',[customer,'Buddy','dog'])).rows[0].id;
   const newAppointment=async(offset)=>{
    const start=new Date(Date.now()+offset*24*3600000);
    const end=new Date(start.getTime()+3600000);
    return (await db.query('INSERT INTO appointments(organization_id,customer_id,pet_id,service_id,staff_id,starts_at,ends_at,price_snapshot,duration_minutes_snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
    [org,customer,pet,service,staff,start,end,200000,60])).rows[0].id;
   };
   const a=await newAppointment(2);
   await db.query('INSERT INTO appointment_services(appointment_id,service_id,position,price_snapshot,duration_minutes_snapshot,name_snapshot) VALUES($1,$2,0,$3,$4,$5)',
    [a,service,200000,60,'Tắm và vệ sinh']);
   await db.query('UPDATE services SET name=$1 WHERE id=$2',['Tên dịch vụ đã đổi',service]);
   const preserved=(await db.query('SELECT name_snapshot FROM appointment_services WHERE appointment_id=$1',[a])).rows[0];
   assert.equal(preserved.name_snapshot,'Tắm và vệ sinh');
   const first=(await db.query("INSERT INTO payments(organization_id,appointment_id,customer_id,amount,method,payment_reference,bank_transaction_reference,status) VALUES($1,$2,$3,$4,'bank_transfer',$5,$6,'paid') RETURNING id",
    [org,a,customer,200000,'PC_TEST_01','BANK_REF_001'])).rows[0].id;
   assert.ok(first);
   const awaiting=await newAppointment(4);
   await db.query("INSERT INTO payments(organization_id,appointment_id,customer_id,amount,method,status,payment_reference) VALUES($1,$2,$3,$4,'bank_transfer','awaiting_payment',$5)",
     [org,awaiting,customer,200000,'PC_TEST_WAIT']);
   const check=await db.query('SELECT status FROM payments WHERE appointment_id=$1',[awaiting]);
   assert.equal(check.rows[0].status,'awaiting_payment');
   const b=await newAppointment(3);
   await assert.rejects(db.query("INSERT INTO payments(organization_id,appointment_id,customer_id,amount,method,payment_reference,bank_transaction_reference,status) VALUES($1,$2,$3,$4,'bank_transfer',$5,$6,'paid')",
    [org,b,customer,200000,'PC_TEST_02','BANK_REF_001']),e=>e.code==='23505');
   const bank=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='payment_bank_settings' AND column_name='bank_account'",[schema])).rowCount;
   assert.equal(bank,1);
   assert.ok(adminId);
  }finally{await db.end();}
 }finally{
  await admin.query('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
  await admin.end();
 }
});
