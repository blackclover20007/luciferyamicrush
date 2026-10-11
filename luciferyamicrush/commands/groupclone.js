// lang: JavaScript, file: commands/groupclone.js
// Clone a group's member list into a new group

import { reply, sleep, jitter } from '../lib/utils.js';

export async function handleGroupClone(sock, msg, args, jid) {
  if (!jid.endsWith('@g.us')) {
    return reply(sock, msg, 'Use in the group you want to clone.');
  }

  const newName = args.join(' ') || 'Yami Clone';

  const meta    = await sock.groupMetadata(jid);
  const members = meta.participants.map(p => p.id);

  await reply(sock, msg, `🔁 Cloning "${meta.subject}" → "${newName}" with ${members.length} members...`);

  try {
    const newGroup = await sock.groupCreate(newName, members);
    await reply(sock, msg, `✅ Group cloned!\nNew group: ${newGroup.gid}\nMembers added: ${members.length}`);

    // Send invite to new group in old group
    const inviteCode = await sock.groupInviteCode(newGroup.gid);
    await sock.sendMessage(jid, {
      text: `🔗 Clone ready: https://chat.whatsapp.com/${inviteCode}`,
    });
  } catch (err) {
    await reply(sock, msg, `Clone failed: ${err.message}`);
  }
}
