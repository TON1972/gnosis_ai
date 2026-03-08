import "dotenv/config";
import { appRouter } from './routers.js';

async function run() {
  const caller = appRouter.createCaller({ user: { role: 'super_admin' } });
  const res = await caller.automations.list();
  console.log(JSON.stringify(res.map(a => ({ id: a.id, name: a.name, triggerDate: a.triggerDate })), null, 2));
}

run().catch(console.error);
