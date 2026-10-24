import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=(name)=>readFileSync(new URL(name,import.meta.url),'utf8');
const migration=file('../infra/003_owner_multitenant.sql');
const routes=Object.fromEntries(['auth','appointments','catalog','management','organizations','pets'].map(name=>[name,file(`../apps/api/src/routes/${name}.ts`)]));
test('Owner global, Admin/Staff are organization memberships, not platform admins',()=>{
 assert.match(migration,/CREATE TABLE organizations/);
 assert.match(migration,/CREATE TABLE organization_members/);
 assert.match(migration,/CHECK\(role IN \('admin','staff'\)\)/);
 assert.match(migration,/users_role_check CHECK\(role IN \('customer','staff','admin','owner'\)\)/);
 assert.match(file('../apps/api/src/lib/auth.ts'),/WHEN u.role='owner' THEN 'owner'/);
 assert.match(file('../apps/api/src/lib/auth.ts'),/WHEN om.role IS NOT NULL AND om.is_active/);
});
test('each store owns services and appointments; staff and services protected by FKs',()=>{
 assert.match(migration,/ALTER TABLE services ADD COLUMN organization_id/);
 assert.match(migration,/services_organization_name_unique UNIQUE\(organization_id,name\)/);
 assert.match(migration,/ALTER TABLE appointments ADD COLUMN organization_id/);
 assert.match(migration,/appointments_org_service_fk/);
 assert.match(migration,/appointments_org_staff_fk/);
 assert.match(routes.appointments,/a\.organization_id=\?/);
 assert.match(routes.catalog,/WHERE id=\? AND organization_id=\?/);
 assert.match(routes.management,/a\.organization_id=\?/);
 assert.match(routes.pets,/a\.organization_id=\?/);
});
test('platform-only owner grants admin; admin only grants staff; invitations are one-time',()=>{
 assert.match(routes.organizations,/if\(actor==='admin'&&d.role!=='staff'\)/);
 assert.match(routes.organizations,/if\(actor==='admin'&&\(prior.role!=='staff'/);
 assert.match(routes.organizations,/requireRole\('owner'\)/);
 assert.match(routes.auth,/accepted_at IS NULL AND i.expires_at>now\(\)/);
 assert.match(routes.auth,/invite.email!==req.user!.email/);
 assert.match(routes.auth,/FOR UPDATE OF i/);
 assert.match(migration,/token_hash CHAR\(64\) NOT NULL UNIQUE/);
});
test('example Trần Mạnh Hùng exists only in development fixtures and UI',()=>{
 assert.match(file('../apps/api/src/seed-data.ts'),/Trần Mạnh Hùng/);
 assert.match(file('../apps/api/src/seed-data.ts'),/NODE_ENV==='production'/);
 assert.match(file('../apps/web/src/pages/Team.tsx'),/Trần Mạnh Hùng/);
 assert.doesNotMatch(file('../apps/api/src/index.ts'),/await seedData/);
});

test('optional real PostgreSQL multi-tenant FK smoke test', {skip:!process.env.TEST_DATABASE_URL},async()=>{
 const url=new URL(process.env.TEST_DATABASE_URL);
 assert.match(decodeURIComponent(url.pathname),/test/i);
 assert.notEqual(process.env.TEST_DATABASE_URL,process.env.DATABASE_URL);
 const {default:pg}=await import('pg');
 const name=`pawcare_owner_test_${process.pid}_${Date.now()}`;
 const admin=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});await admin.connect();
 try{
  await admin.query(`CREATE SCHEMA "${name}"`);
  const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${name} -c timezone=UTC`});await db.connect();
  try{
   await db.query(file('../infra/001_postgres_schema.sql'));
   await db.query(migration);
   const user=await db.query(`INSERT INTO users(full_name,email,password_hash,role) VALUES('Example','tenanttest@example.test','hash','customer') RETURNING id`);
   const id=user.rows[0].id;
   const a=(await db.query("INSERT INTO organizations(name,slug) VALUES('A','a') RETURNING id")).rows[0].id;
   const b=(await db.query("INSERT INTO organizations(name,slug) VALUES('B','b') RETURNING id")).rows[0].id;
   const s=(await db.query('INSERT INTO services(organization_id,name,price,duration_minutes) VALUES($1,$2,100,60) RETURNING id',[a,'Bath'])).rows[0].id;
   const pet=(await db.query("INSERT INTO pets(owner_id,name,species) VALUES($1,'Milo','dog') RETURNING id",[id])).rows[0].id;
   const begin='2026-12-07T03:00:00Z',end='2026-12-07T04:00:00Z';
   await db.query('INSERT INTO appointments(organization_id,customer_id,pet_id,service_id,starts_at,ends_at,price_snapshot) VALUES($1,$2,$3,$4,$5,$6,100)',[a,id,pet,s,begin,end]);
   await assert.rejects(db.query('INSERT INTO appointments(organization_id,customer_id,pet_id,service_id,starts_at,ends_at,price_snapshot) VALUES($1,$2,$3,$4,$5,$6,100)',[b,id,pet,s,begin,end]), e=>e.code==='23503');
   assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM appointments WHERE organization_id=$1',[b])).rows[0].count,0);
  }finally{await db.end();}
 }finally{await admin.query(`DROP SCHEMA IF EXISTS "${name}" CASCADE`);await admin.end();}
});
