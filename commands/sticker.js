// lang: JavaScript, file: commands/sticker.js
// Convert image/gif/video to WhatsApp sticker — bypasses size limits via sharp/ffmpeg

import { reply } from '../lib/utils.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { CONFIG } from '../config.js';
import ffmpegPath from 'ffmpeg-static';

export async function handleStickerMaker(sock, msg, args, jid) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const target = quoted ? {
    key: {
      remoteJid: jid,
      id: msg.message.extendedTextMessage.contextInfo.stanzaId,
      participant: msg.message.extendedTextMessage.contextInfo.participant,
    },
    message: quoted,
  } : msg;

  const msgType = Object.keys(target.message || {})[0];

  if (!['imageMessage','videoMessage','stickerMessage'].includes(msgType)) {
    return reply(sock, msg, 'Reply to an image, gif, or short video with .sticker');
  }

  try {
    const buffer = await downloadMediaMessage(target, 'buffer', {}, {
      logger: { info: ()=>{}, warn: ()=>{}, error: ()=>{} }
    });

    const pack   = args.join(' ').split('|')[0]?.trim() || 'Yami';
    const author = args.join(' ').split('|')[1]?.trim() || 'Bot';

    if (msgType === 'imageMessage') {
      // Convert to 512x512 webp
      const webp = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
        .webp({ quality: 80 })
        .toBuffer();

      await sock.sendMessage(jid, {
        sticker: webp,
        mimetype: 'image/webp',
        stickerPackId: pack,
        stickerPackName: pack,
        stickerAuthorName: author,
      });

    } else if (msgType === 'videoMessage') {
      // Convert to animated webp via ffmpeg
      const tmpIn  = `${CONFIG.DATA_DIR}/stk_in_${Date.now()}.mp4`;
      const tmpOut = `${CONFIG.DATA_DIR}/stk_out_${Date.now()}.webp`;

      writeFileSync(tmpIn, buffer);
      execSync(
        `"${ffmpegPath}" -i "${tmpIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0,setsar=1" -vcodec libwebp -lossless 0 -qscale 50 -loop 0 -preset default -an -vsync 0 -t 6 -y "${tmpOut}"`,
        { stdio: 'ignore' }
      );

      const webp = readFileSync(tmpOut);
      await sock.sendMessage(jid, {
        sticker: webp,
        mimetype: 'image/webp',
        stickerPackId: pack,
        stickerPackName: pack,
        stickerAuthorName: author,
      });

      try { unlinkSync(tmpIn); unlinkSync(tmpOut); } catch {}
    }
  } catch (err) {
    await reply(sock, msg, `Sticker error: ${err.message}`);
  }
}
