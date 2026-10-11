// lang: JavaScript, file: commands/massadd.js
// Add a list of numbers to a group — requires admin

import { reply, numToJid, sleep, jitter } from '../lib/utils.js';
import { readFileSync, existsSync } from 'fs';
import { CONFIG } from '../config.js';

export async function handleMassAdd(sock, msg, args, jid) {
  if (!jid.endsWith('@g.us')) {
    return reply(sock, msg, 'Must be used in a group.');
  }

  // .massadd — reads from data/bulk_targets.txt
  // .massadd [number1] [number2] ... — inline numbers

  let numbers = [];

  if (args.length > 0) {
    numbers = args.map(a => a.replace(/\D/g, '')).filter(n => n.length >= 7);
  } else {
    const file = `${CONFIG.DATA_DIR}/bulk_targets.txt`;
    if (!existsSync(file)) {
      return reply(sock, msg, `No inline numbers and no ${file} found.`);
    }
    numbers = readFileSync(file, 'utf8')
      .split('\n').map(l => l.trim()).filter(l => /^\d+$/.test(l));
  }

  if (!numbers.length) return reply(sock, msg, 'No valid numbers to add.');

  await reply(sock, msg, `➕ Mass-adding ${numbers.length} numbers...`);

  const jids = numbers.map(n => numToJid(n));
  let added = 0, failed = 0;

  // Add in batches of 5 to avoid being kicked by WA
  for (let i = 0; i < jids.length; i += 5) {
    const batch = jids.slice(i, i + 5);
    try {
      const result = await sock.groupParticipantsUpdate(jid, batch, 'add');
      for (const r of result) {
        r.status === '200' ? added++ : failed++;
      }
    } catch { failed += batch.length; }
    await sleep(jitter(1500, 500));
  }

  await reply(sock, msg, `✅ Mass-add done — added: ${added} | failed: ${failed}`);
}
