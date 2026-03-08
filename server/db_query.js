import pg from 'pg';
const { Client } = pg;
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.oogjsbskwuetvatgmwgb:HJwCCoI6VJ1SFgnG@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT a.id, a.name, l."sentAt", u.email FROM email_automations a LEFT JOIN automation_logs l ON a.id = l."automationId" LEFT JOIN users u ON l."userId" = u.id WHERE a."triggerType" = \'specific_date\' ORDER BY a.id DESC, l."sentAt" DESC LIMIT 10');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
