// lang: JavaScript, file: lib/utils.js
// Shared utility functions

import { CONFIG } from '../config.js';

export function getBody(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    ''
  );
}

export function getSender(msg) {
  return msg.key.participant || msg.key.remoteJid || '';
}

export function isOwner(sender) {
  const num = sender.replace(/[^0-9]/g, '');
  return num === CONFIG.OWNER_NUMBER;
}

export function getMentions(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

export function getQuoted(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

export function getQuotedKey(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (!ctx) return null;
  return {
    remoteJid: msg.key.remoteJid,
    id:        ctx.stanzaId,
    participant: ctx.participant,
  };
}

export function numToJid(num) {
  const clean = num.replace(/[^0-9]/g, '');
  return `${clean}@s.whatsapp.net`;
}

export function jidToNum(jid) {
  return jid.replace(/@.+/, '');
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function jitter(base, range = 200) {
  return base + Math.floor(Math.random() * range * 2) - range;
}

export async function react(sock, msg, emoji) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key },
    });
  } catch (_) {}
}

export async function reply(sock, msg, text) {
  await sock.sendMessage(msg.key.remoteJid, {
    text,
    quoted: msg,
  });
}
