// lang: JavaScript, file: commands/masskick.js
// Kick everyone from a group (except owner) — requires admin

import { reply, sleep, jitter } from '../lib/utils.js';
import { CONFIG } from '../config.js';

export async function handleMassKick(sock, msg, args, jid) {
  if (!jid.endsWith('@g.us')) {
    return reply(sock, msg, 'Must be used in a group.');
  }

  const confirm = args[0]?.toLowerCase();
  if (confirm !== 'confirm') {
    return reply(sock, msg,
      '⚠️ This will kick EVERYONE from the group.\n' +
      'Type: .masskick confirm to proceed.'
    );
  }

  const meta    = await sock.groupMetadata(jid);
  const ownerJid = `${CONFIG.OWNER_NUMBER}@s.whatsapp.net`;

  const targets = meta.participants
    .filter(p => p.id !== ownerJid && !p.admin)
    .map(p => p.id);

  if (!targets.length) return reply(sock, msg, 'No non-admin members to kick.');

  await reply(sock, msg, `🔴 Kicking ${targets.length} members...`);

  let kicked = 0, failed = 0;

  for (let i = 0; i < targets.length; i += 5) {
    const batch = targets.slice(i, i + 5);
    try {
      await sock.groupParticipantsUpdate(jid, batch, 'remove');
      kicked += batch.length;
    } catch { failed += batch.length; }
    await sleep(jitter(1000, 300));
  }

  await reply(sock, msg, `✅ Kicked: ${kicked} | Failed: ${failed}`);
}
