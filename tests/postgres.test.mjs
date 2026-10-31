import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file = (name) => readFileSync(new URL(name,import.meta.url),'utf8');
const ddl = file('../database/001_postgres_schema.sql');
const routes = ['auth','appointments','catalog','pets','management'].map(s=>file(`../backend/src/routes/${s}.ts`)).join('\n');

test('PostgreSQL schema gồm các bảng, constraints, foreign keys và cập nhật timestamp',()=>{
 for(const table of ['users','staff_profiles','sessions','pets','care_records','services','appointments']){
   assert.match(ddl,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`));
 }
 assert.match(ddl,/TIMESTAMPTZ NOT NULL/);
 assert.match(ddl,/REFERENCES users\(id\)/);
 assert.match(ddl,/CHECK\s*\(ends_at > starts_at\)/);
 assert.match(ddl,/trg_appointments_updated_at/);
});
test('Backend không dùng cú pháp SQLite hoặc MySQL cũ',()=>{
 assert.doesNotMatch(routes,/\bstrftime\s*\(|\bdatetime\s*\(\s*[\x27\x22]now|INSERT\s+OR\s+IGNORE|\bis_active\s*=\s*[01]\b/i);
 assert.match(routes,/pg_advisory|lockStaff/);
 const db=file('../backend/src/lib/db.ts');
 assert.match(db,/new pg\.Pool/);
 assert.match(db,/BEGIN/); assert.match(db,/ROLLBACK/);
 assert.doesNotMatch(db,/node:sqlite/);
});
test('Production không tự tạo tài khoản demo và phục vụ frontend + API chung domain',()=>{
 const entry=file('../backend/src/index.ts');
 assert.doesNotMatch(entry,/await seedData\s*\(/);
 assert.match(entry,/await migrate\(\)/);
 assert.match(entry,/express\.static\(webDist/);
 assert.match(entry,/SESSION_COOKIE_SECURE|appOrigin/);
});

test('Integration: PostgreSQL thật (chỉ chạy khi TEST_DATABASE_URL là DB kiểm thử)', {skip: !process.env.TEST_DATABASE_URL}, async()=>{
 // Never drop or modify a production schema or database.
 const url=new URL(process.env.TEST_DATABASE_URL);
 assert.match(decodeURIComponent(url.pathname),/test/i,'Chỉ dùng một DATABASE dành riêng cho TEST, tên DB phải chứa test');
 assert.notEqual(process.env.TEST_DATABASE_URL,process.env.DATABASE_URL,'Không được chạy test với DATABASE_URL của app');
 const {default: pg}=await import('pg');
 const suffix=`pawcare_test_${process.pid}_${Date.now()}`;
 const admin=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
 await admin.connect();
 try {
   await admin.query(`CREATE SCHEMA "${suffix}"`);
   const config={connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${suffix} -c timezone=UTC`};
   const first=new pg.Client(config), second=new pg.Client(config);
   await Promise.all([first.connect(),second.connect()]);
   try {
     await first.query(ddl);
     const user=await first.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',['Test','user@example.test','hash','customer']);
     const customerId=user.rows[0].id;
     const pet=await second.query('INSERT INTO pets(owner_id,name,species) VALUES($1,$2,$3) RETURNING id',[customerId,'Milo','dog']);
     assert.ok(pet.rows[0].id);
     const count=await first.query('SELECT COUNT(*)::int AS total FROM pets WHERE owner_id=$1',[customerId]);
     assert.equal(count.rows[0].total,1,'Hai PostgreSQL connection dùng cùng dữ liệu');
     await assert.rejects(second.query('INSERT INTO pets(owner_id,name,species) VALUES($1,$2,$3)',[99999,'Ghost','cat']), e=>e.code==='23503');
     await first.query('BEGIN');
     await first.query('INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3)',['Rollback','rollback@example.test','hash']);
     await first.query('ROLLBACK');
     assert.equal((await second.query('SELECT COUNT(*)::int AS count FROM users WHERE email=$1',['rollback@example.test'])).rows[0].count,0);
   } finally { await Promise.all([first.end(),second.end()]); }
 } finally {
   await admin.query(`DROP SCHEMA IF EXISTS "${suffix}" CASCADE`);
   await admin.end();
 }
});
