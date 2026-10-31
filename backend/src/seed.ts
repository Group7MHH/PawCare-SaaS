import {seedData} from './seed-data.js';
import {pool} from './lib/db.js';
import {migrate} from './migrate.js';
migrate().then(seedData).then(()=>pool.end()).catch(async error=>{
  console.error(error);await pool.end();process.exitCode=1;
});
