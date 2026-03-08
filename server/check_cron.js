import pg from 'pg';
const { Client } = pg;
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.oogjsbskwuetvatgmwgb:HJwCCoI6VJ1SFgnG@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT id, name, "triggerDate" FROM email_automations WHERE "triggerType" = \'specific_date\' ORDER BY "triggerDate" DESC LIMIT 5');
  console.log("Automations:");
  console.log(JSON.stringify(res.rows, null, 2));

  const logs = await client.query('SELECT id, "automationId", "userId", "sentAt" FROM automation_logs ORDER BY "sentAt" DESC LIMIT 5');
  console.log("\nRecent Logs:");
  console.log(JSON.stringify(logs.rows, null, 2));
  
  await client.end();
}
run().catch(console.error);
