// lang: JavaScript, file: commands/fakereply.js
// Craft a fake reply that quotes any message content you specify

import { reply, numToJid, getMentions } from '../lib/utils.js';

export async function handleFakeReply(sock, msg, args, jid) {
  // Usage: .fakereply @target | fake quoted text | your reply text
  // Or:    .fakereply number | fake quoted text | your reply text

  const full = args.join(' ');
  const parts = full.split('|').map(p => p.trim());

  if (parts.length < 3) {
    return reply(sock, msg,
      'Usage: .fakereply @target | [fake quoted text] | [reply text]\n' +
      'Example: .fakereply @2637xxx | I hate you | No you said this 😂'
    );
  }

  const mentions = getMentions(msg);
  let targetJid = mentions.length > 0
    ? mentions[0]
    : numToJid(parts[0].replace(/[^0-9]/g, ''));

  const quotedText  = parts[1];
  const replyText   = parts[2];
  const targetNum   = targetJid.replace('@s.whatsapp.net', '');

  // Build a fake context info that WA renders as a quoted message
  await sock.sendMessage(jid, {
    text: replyText,
    contextInfo: {
      stanzaId:    'YAMI' + Date.now().toString(36).toUpperCase(),
      participant: targetJid,
      quotedMessage: {
        conversation: quotedText,
      },
    },
  });
}
