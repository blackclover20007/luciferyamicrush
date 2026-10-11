// lang: JavaScript, file: commands/help.js
// Evil-themed menu — auto-detects all loaded commands, owner-only, pair command

import { reply, isOwner } from '../lib/utils.js';
import { CONFIG } from '../config.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const P = CONFIG.PREFIX;

// ── auto-detect all command files ─────────────────────────────────────────────
function detectCommands() {
  try {
    return readdirSync(__dirname)
      .filter(f => f.endsWith('.js') && f !== 'help.js')
      .map(f => f.replace('.js', ''));
  } catch { return []; }
}

// ── command metadata map ───────────────────────────────────────────────────────
const CMD_META = {
  bugcrush:      { sym: '💀', cat: 'WEAPONS',    desc: 'Crash/freeze target WA client',           usage: '[@/num] [low|medium|high|nuke] [count]' },
  presenceflood: { sym: '⚡', cat: 'WEAPONS',    desc: 'Flood target with presence spam',          usage: '[@/num] [count] [delay]' },
  typingspoof:   { sym: '👁',  cat: 'WEAPONS',    desc: 'Fake typing/recording indicator',          usage: '[typing|recording] [sec] [@/num]' },
  fakereply:     { sym: '🩸', cat: 'WEAPONS',    desc: 'Forge a quoted reply from anyone',         usage: '@target | [fake text] | [your reply]' },
  bulksend:      { sym: '📡', cat: 'BROADCAST',  desc: 'Blast message to number list',             usage: '[delay?] [message]' },
  tagall:        { sym: '🔊', cat: 'BROADCAST',  desc: '@mention everyone in group',               usage: '[message]' },
  massadd:       { sym: '🕷',  cat: 'GROUP',      desc: 'Bulk add numbers to group',               usage: '[numbers...] or from file' },
  masskick:      { sym: '🗡',  cat: 'GROUP',      desc: 'Kick all non-admins from group',           usage: 'confirm' },
  groupclone:    { sym: '🔁', cat: 'GROUP',      desc: 'Duplicate group member list to new group', usage: '[new name]' },
  groupscrape:   { sym: '🧬', cat: 'GROUP',      desc: 'Extract all member numbers from group',    usage: '' },
  ghost:         { sym: '👻', cat: 'STEALTH',    desc: 'Vanish — appear offline while active',     usage: '[on|off]' },
  antiread:      { sym: '🫥', cat: 'STEALTH',    desc: 'Read without sending blue ticks',          usage: '[on|off]' },
  lastseen:      { sym: '🕰',  cat: 'STEALTH',    desc: 'Control last seen visibility',             usage: '[hide|contacts|all]' },
  viewonce:      { sym: '📸', cat: 'EXTRACT',    desc: 'Bypass view-once — save the media',        usage: 'reply to view-once' },
  statusdl:      { sym: '🌑', cat: 'EXTRACT',    desc: 'Silently pull contact statuses',           usage: 'list / [@/num]' },
  pfp:           { sym: '🎭', cat: 'EXTRACT',    desc: "Grab any contact's profile picture",       usage: '[@/num]' },
  presencespy:   { sym: '🔭', cat: 'RECON',      desc: 'Track contact online/offline times',       usage: 'watch/unwatch/log/list [num]' },
  numbercheck:   { sym: '🔎', cat: 'RECON',      desc: 'Check if numbers are on WhatsApp',         usage: '[numbers...]' },
  autoreply:     { sym: '🤖', cat: 'AUTOMATION', desc: 'Keyword/regex triggered auto-replies',     usage: 'on/off/add/regex/del/list' },
  autoreact:     { sym: '⚗',  cat: 'AUTOMATION', desc: 'Auto-react to messages by keyword',        usage: 'on/off/add/del/list' },
  schedule:      { sym: '⏳', cat: 'AUTOMATION', desc: 'Schedule messages with cron or HH:MM',     usage: '[HH:MM] [num] [msg]' },
  forward:       { sym: '🔀', cat: 'AUTOMATION', desc: 'Auto-forward from source to destination',  usage: 'add/remove/list' },
  autoblock:     { sym: '🛡',  cat: 'DEFENSE',    desc: 'Auto-block on trigger words',              usage: 'on/off/add/remove/list' },
  flooddetect:   { sym: '🚨', cat: 'DEFENSE',    desc: 'Detect spammers — auto mute or block',     usage: 'on/off/threshold/action' },
  sticker:       { sym: '🎨', cat: 'MEDIA',      desc: 'Convert image/gif/video to sticker',       usage: '[pack name|author?]' },
  filespoof:     { sym: '🧪', cat: 'MEDIA',      desc: 'Disguise file mimetype on send',           usage: 'reply + [filename] [mime?]' },
};

// Category display order + evil headers
const CATEGORIES = [
  { key: 'WEAPONS',    title: '⚔️  ｢ WEAPONS ｣',    border: '▓' },
  { key: 'BROADCAST',  title: '📡  ｢ BROADCAST ｣',   border: '▓' },
  { key: 'GROUP',      title: '🕷️  ｢ GROUP RAID ｣',  border: '▓' },
  { key: 'STEALTH',    title: '👻  ｢ STEALTH ｣',     border: '▓' },
  { key: 'EXTRACT',    title: '🩸  ｢ EXTRACT ｣',     border: '▓' },
  { key: 'RECON',      title: '🔭  ｢ RECON ｣',       border: '▓' },
  { key: 'AUTOMATION', title: '🤖  ｢ AUTOMATION ｣',  border: '▓' },
  { key: 'DEFENSE',    title: '🛡️  ｢ DEFENSE ｣',     border: '▓' },
  { key: 'MEDIA',      title: '🎨  ｢ MEDIA ｣',       border: '▓' },
];

function buildMenu(detectedCmds) {
  const lines = [];

  lines.push('```');
  lines.push('╔══════════════════════════════════════╗');
  lines.push('║  ████  ██   ██  █████  ███  ████    ║');
  lines.push('║  ▀██▀  ███  ██ ██  ██ ████ ██  ██   ║');
  lines.push('║   ██   ████ ██ ██  ██ ████ ██  ██   ║');
  lines.push('║   ██   ██ ████  █████ ████  ████    ║');
  lines.push('║                                      ║');
  lines.push('║     🏴‍☠️  W H A T S A P P  G O D      ║');
  lines.push('╚══════════════════════════════════════╝');
  lines.push('```');
  lines.push('');
  lines.push(`👑 *Owner:* ${CONFIG.OWNER_NUMBER}`);
  lines.push(`⚙️ *Prefix:* \`${P}\``);
  lines.push(`🔩 *Commands detected:* ${detectedCmds.length}`);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  for (const cat of CATEGORIES) {
    const cmds = detectedCmds
      .map(c => ({ name: c, meta: CMD_META[c] }))
      .filter(c => c.meta?.cat === cat.key);

    if (!cmds.length) continue;

    lines.push(`*${cat.title}*`);
    lines.push('');

    for (const { name, meta } of cmds) {
      lines.push(`${meta.sym} \`${P}${name}\``);
      lines.push(`  ┗ ${meta.desc}`);
      if (meta.usage) lines.push(`  ┗ _${P}${name} ${meta.usage}_`);
      lines.push('');
    }

    lines.push('┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄');
    lines.push('');
  }

  lines.push('*🔗  ｢ SYSTEM ｣*');
  lines.push('');
  lines.push(`🔑 \`${P}pair\``);
  lines.push('  ┗ Generate pairing code (no QR needed)');
  lines.push(`  ┗ _${P}pair [your number]_`);
  lines.push('');
  lines.push(`📖 \`${P}help\` / \`${P}menu\``);
  lines.push('  ┗ Show this menu');
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('> _All commands owner-only._');
  lines.push('> _Unauthorized use returns silence._');

  return lines.join('\n');
}

// ── pair command handler ───────────────────────────────────────────────────────
export async function handlePair(sock, msg, args, jid) {
  const number = args[0]?.replace(/\D/g, '');
  if (!number) {
    return reply(sock, msg,
      `*🔑 Pair Mode*\n\nUsage: ${P}pair [your number]\nExample: ${P}pair 263784970429\n\nThis generates a pairing code so you can link without scanning a QR.`
    );
  }

  try {
    const code = await sock.requestPairingCode(number);
    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
    await reply(sock, msg,
      `*🔑 Pairing Code*\n\n\`\`\`${formatted}\`\`\`\n\nOn WhatsApp:\nLinked Devices → Link a Device → Link with phone number\nEnter the code above.\n\n_Expires in 60 seconds._`
    );
  } catch (err) {
    await reply(sock, msg, `Pair failed: ${err.message}`);
  }
}

// ── help handler ───────────────────────────────────────────────────────────────
export async function handleHelp(sock, msg, args, jid, sender) {
  if (!isOwner(sender)) return; // silent — no response to non-owner

  const detected = detectCommands();
  const menu     = buildMenu(detected);
  await reply(sock, msg, menu);
}
