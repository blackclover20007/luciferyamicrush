// lang: JavaScript, file: commands/profilepic.js
// Fetch and send any contact's profile picture

import { reply, numToJid, getMentions } from '../lib/utils.js';

export async function handleProfilePic(sock, msg, args, jid) {
  const mentions = getMentions(msg);

  let target;
  if (mentions.length > 0) {
    target = mentions[0];
  } else if (args[0]) {
    target = numToJid(args[0].replace(/\D/g, ''));
  } else {
    return reply(sock, msg, 'Usage: .pfp @mention or .pfp [number]');
  }

  try {
    const url = await sock.profilePictureUrl(target, 'image');
    await sock.sendMessage(jid, {
      image:   { url },
      caption: `📸 Profile picture: ${target.replace('@s.whatsapp.net', '')}`,
    });
  } catch {
    await reply(sock, msg, '❌ No profile picture available or contact not found.');
  }
}
