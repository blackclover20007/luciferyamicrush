// lang: JavaScript, file: commands/filespoof.js
// Spoof file mimetype — send "unsupported" or disguised file types

import { reply } from '../lib/utils.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import mime from 'mime-types';

export async function handleFilespoof(sock, msg, args, jid) {
  // Usage: .spoof [filename.ext] [fake_mimetype?]
  // Reply to a document/image/video with this command

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) {
    return reply(sock, msg,
      'Reply to a file with .spoof [filename] [mimetype?]\n' +
      'Example: .spoof payload.pdf application/pdf\n' +
      'Example: .spoof virus.apk application/vnd.android.package-archive'
    );
  }

  const target = {
    key: {
      remoteJid: jid,
      id: msg.message.extendedTextMessage.contextInfo.stanzaId,
      participant: msg.message.extendedTextMessage.contextInfo.participant,
    },
    message: quoted,
  };

  const filename = args[0] || 'file.bin';
  const ext      = filename.split('.').pop();
  const mimetype = args[1] || mime.lookup(filename) || 'application/octet-stream';

  try {
    const buffer = await downloadMediaMessage(target, 'buffer', {}, {
      logger: { info: ()=>{}, warn: ()=>{}, error: ()=>{} }
    });

    await sock.sendMessage(jid, {
      document: buffer,
      mimetype,
      fileName: filename,
    });

    await reply(sock, msg, `✅ Sent as: ${filename} (${mimetype})`);
  } catch (err) {
    await reply(sock, msg, `Failed: ${err.message}`);
  }
}
