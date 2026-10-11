// lang: JavaScript, file: commands/bulksend.js
// Bulk send — blast a message to a list of numbers with jitter delay

import { reply, numToJid, sleep, jitter } from '../lib/utils.js';
import { CONFIG } from '../config.js';
import { readFileSync, existsSync } from 'fs';

export async function handleBulkSend(sock, msg, args, jid) {
  // Usage:
  //   .bulk [message] — reads numbers from data/bulk_targets.txt
  //   .bulk [delay_ms] [message] — custom delay

  const TARGETS_FILE = `${CONFIG.DATA_DIR}/bulk_targets.txt`;

  if (!existsSync(TARGETS_FILE)) {
    return reply(sock, msg,
      `No targets file found.\n` +
      `Create: ${TARGETS_FILE}\n` +
      `One number per line (e.g., 263784970429)`
    );
  }

  const lines = readFileSync(TARGETS_FILE, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+$/.test(l));

  if (!lines.length) {
    return reply(sock, msg, 'Targets file is empty or has no valid numbers.');
  }

  let delay   = 1200;
  let message = args.join(' ');

  // if first arg is a number, treat as delay
  if (!isNaN(args[0]) && parseInt(args[0]) >= CONFIG.SPAM_DELAY_FLOOR) {
    delay   = parseInt(args[0]);
    message = args.slice(1).join(' ');
  }

  if (!message) {
    return reply(sock, msg, 'Usage: .bulk [delay_ms?] [message]');
  }

  await reply(sock, msg, `📤 Bulk send started → ${lines.length} targets | delay: ${delay}ms`);

  let sent = 0, failed = 0;

  for (const num of lines) {
    try {
      const targetJid = numToJid(num);
      await sock.sendMessage(targetJid, { text: message });
      sent++;
    } catch {
      failed++;
    }
    await sleep(jitter(delay));
  }

  await reply(sock, msg, `✅ Bulk done — sent: ${sent} | failed: ${failed}`);
}
