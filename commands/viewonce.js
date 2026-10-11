// lang: JavaScript, file: commands/viewonce.js
// Bypass view-once — re-send the media as a regular message

import { reply } from '../lib/utils.js';
import { getQuoted } from '../lib/utils.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { CONFIG } from '../config.js';

export async function handleViewOnce(sock, msg, args, jid) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) {
    await reply(sock, msg, 'Reply to a view-once message with .viewonce');
    return;
  }

  // Check if it's a view-once image or video
  const voImage = quoted.viewOnceMessage?.message?.imageMessage
                || quoted.viewOnceMessageV2?.message?.imageMessage
                || quoted.viewOnceMessageV2Extension?.message?.imageMessage;

  const voVideo = quoted.viewOnceMessage?.message?.videoMessage
                || quoted.viewOnceMessageV2?.message?.videoMessage
                || quoted.viewOnceMessageV2Extension?.message?.videoMessage;

  const mediaMsg = voImage || voVideo;

  if (!mediaMsg) {
    await reply(sock, msg, 'Quoted message is not a view-once media');
    return;
  }

  // Reconstruct as regular message to download
  const fakeMsg = {
    key: msg.message?.extendedTextMessage?.contextInfo
      ? {
          remoteJid: jid,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant,
        }
      : msg.key,
    message: quoted.viewOnceMessage?.message
          || quoted.viewOnceMessageV2?.message
          || quoted.viewOnceMessageV2Extension?.message,
  };

  try {
    const buffer = await downloadMediaMessage(
      fakeMsg,
      'buffer',
      {},
      { logger: { info: () => {}, warn: () => {}, error: () => {} } }
    );

    if (voImage) {
      await sock.sendMessage(jid, {
        image:   buffer,
        caption: '👁️ View-once bypass',
      });
    } else {
      await sock.sendMessage(jid, {
        video:   buffer,
        caption: '👁️ View-once bypass',
      });
    }
  } catch (err) {
    await reply(sock, msg, `Failed to download media: ${err.message}`);
  }
}
