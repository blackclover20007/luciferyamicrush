// lang: JavaScript, file: commands/numbercheck.js
// Check if a number is registered on WhatsApp without adding to contacts

import { reply, numToJid } from '../lib/utils.js';

export async function handleNumberCheck(sock, msg, args, jid) {
  if (!args[0]) {
    return reply(sock, msg,
      'Usage: .checknum [number]\n' +
      'Or:    .checknum [num1] [num2] [num3] ...\n' +
      'Example: .checknum 263784970429'
    );
  }

  const numbers = args.map(a => a.replace(/\D/g, '')).filter(n => n.length >= 7);

  if (!numbers.length) {
    return reply(sock, msg, 'No valid numbers provided.');
  }

  await reply(sock, msg, `🔍 Checking ${numbers.length} number(s)...`);

  const results = await sock.onWhatsApp(...numbers.map(n => n + '@s.whatsapp.net'));

  if (!results || !results.length) {
    return reply(sock, msg, '❌ None of those numbers are on WhatsApp.');
  }

  const found  = results.filter(r => r.exists);
  const lines  = results.map(r =>
    `${r.jid.replace('@s.whatsapp.net', '')} → ${r.exists ? '✅ On WhatsApp' : '❌ Not found'}`
  );

  await reply(sock, msg,
    `*Number Check Results:*\n` +
    `Found: ${found.length}/${numbers.length}\n\n` +
    lines.join('\n')
  );
}
