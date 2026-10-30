import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pool} from './lib/db.js';

export async function migrate(){
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    // Safe when several replicas start together.
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [42371, 0]);
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    for(const file of ['001_postgres_schema.sql','002_default_services.sql','003_owner_multitenant.sql','004_single_store.sql','005_completed_revenue.sql']){
      const existing=await client.query('SELECT version FROM schema_migrations WHERE version=$1',[file]);
      if(existing.rowCount)continue;
      await client.query(readFileSync(resolve(process.cwd(),'../../infra',file),'utf8'));
      await client.query('INSERT INTO schema_migrations(version) VALUES($1)',[file]);
      console.log(`[postgres] migration applied: ${file}`);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
// Explicit CLI entry point. The server also migrates before accepting requests.
if(process.argv[1] && /(?:^|[\\/])migrate\.(?:ts|js)$/.test(process.argv[1])){
  migrate().then(()=>pool.end()).catch(async error=>{console.error(error);await pool.end();process.exitCode=1;});
}
