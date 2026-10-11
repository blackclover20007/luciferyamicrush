// lang: JavaScript, file: commands/schedule.js
// Schedule a message to send at a specific time using node-cron

import cron from 'node-cron';
import { reply, numToJid } from '../lib/utils.js';

const jobs = new Map(); // id → { task, jid, message, time }
let jobCounter = 0;

export async function handleSchedule(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'list') {
    if (!jobs.size) return reply(sock, msg, 'No scheduled messages.');
    const list = [...jobs.entries()].map(([id, j]) =>
      `${id}. [${j.cronExpr}] → ${j.targetJid} | ${j.message}`
    ).join('\n');
    return reply(sock, msg, `*Scheduled Messages:*\n${list}`);
  }

  if (sub === 'cancel') {
    const id = parseInt(args[1]);
    if (!jobs.has(id)) return reply(sock, msg, 'Job not found.');
    jobs.get(id).task.stop();
    jobs.delete(id);
    return reply(sock, msg, `✅ Job ${id} cancelled.`);
  }

  // .schedule [cron|HH:MM] [jid|number] [message]
  // .schedule 14:30 2637xxxxxx Good afternoon!
  // .schedule "0 14 * * *" 2637xxxxxx Daily reminder

  if (args.length < 3) {
    return reply(sock, msg,
      '*Schedule a message:*\n' +
      '.schedule [HH:MM] [number] [message]\n' +
      '.schedule [cron expr] [number] [message]\n' +
      '.schedule list\n' +
      '.schedule cancel [id]'
    );
  }

  let cronExpr = args[1];
  const numOrJid = args[2];
  const message  = args.slice(3).join(' ');

  // Convert HH:MM to cron
  if (/^\d{1,2}:\d{2}$/.test(cronExpr)) {
    const [h, m] = cronExpr.split(':');
    cronExpr = `${parseInt(m)} ${parseInt(h)} * * *`;
  }

  if (!cron.validate(cronExpr)) {
    return reply(sock, msg, `Invalid cron expression: ${cronExpr}`);
  }

  const targetJid = numOrJid.includes('@')
    ? numOrJid
    : numToJid(numOrJid.replace(/[^0-9]/g, ''));

  const id = ++jobCounter;

  const task = cron.schedule(cronExpr, async () => {
    try {
      await sock.sendMessage(targetJid, { text: message });
    } catch (err) {
      console.error(`[Schedule] Job ${id} failed:`, err.message);
    }
  });

  jobs.set(id, { task, cronExpr, targetJid, message });

  await reply(sock, msg, `✅ Job ${id} scheduled: [${cronExpr}] → ${targetJid}\nMessage: ${message}`);
}
