// lang: JavaScript, file: commands/autoreact.js
// Auto-react to messages matching keyword rules

import { reply } from '../lib/utils.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CONFIG } from '../config.js';

const FILE = `${CONFIG.DATA_DIR}/autoreact.json`;

function load() {
  if (!existsSync(FILE)) return { active: false, rules: [] };
  try { return JSON.parse(readFileSync(FILE, 'utf8')); }
  catch { return { active: false, rules: [] }; }
}

function save(d) { writeFileSync(FILE, JSON.stringify(d, null, 2)); }

let state = load();

export const AutoReact = {
  check(sock, msg, body) {
    if (!state.active) return;
    const lower = body.toLowerCase();
    for (const rule of state.rules) {
      if (lower.includes(rule.trigger)) {
        sock.sendMessage(msg.key.remoteJid, {
          react: { text: rule.emoji, key: msg.key },
        }).catch(() => {});
        break;
      }
    }
  },
};

export async function handleAutoReact(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'on')  { state.active = true;  save(state); return reply(sock, msg, '✅ Auto-react ON'); }
  if (sub === 'off') { state.active = false; save(state); return reply(sock, msg, '❌ Auto-react OFF'); }

  if (sub === 'add') {
    // .autoreact add [trigger] | [emoji]
    const rest  = args.slice(1).join(' ');
    const parts = rest.split('|');
    if (parts.length < 2) return reply(sock, msg, 'Usage: .autoreact add trigger | emoji');
    const trigger = parts[0].trim().toLowerCase();
    const emoji   = parts[1].trim();
    state.rules.push({ trigger, emoji });
    save(state);
    return reply(sock, msg, `✅ "${trigger}" → ${emoji}`);
  }

  if (sub === 'del') {
    const idx = parseInt(args[1]);
    if (isNaN(idx) || idx < 1 || idx > state.rules.length) {
      return reply(sock, msg, 'Usage: .autoreact del [number]');
    }
    state.rules.splice(idx - 1, 1);
    save(state);
    return reply(sock, msg, `✅ Rule ${idx} deleted`);
  }

  if (sub === 'list') {
    if (!state.rules.length) return reply(sock, msg, 'No rules set.');
    const list = state.rules.map((r, i) => `${i+1}. "${r.trigger}" → ${r.emoji}`).join('\n');
    return reply(sock, msg, `*Auto-React Rules:*\n${list}`);
  }

  await reply(sock, msg,
    '.autoreact on/off\n.autoreact add trigger | emoji\n.autoreact del [n]\n.autoreact list'
  );
}
