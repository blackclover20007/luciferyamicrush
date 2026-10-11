// lang: JavaScript, file: commands/autoblock.js
// Auto-block contacts who send trigger words

import { reply } from '../lib/utils.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CONFIG } from '../config.js';

const FILE = `${CONFIG.DATA_DIR}/autoblock_triggers.json`;

function load() {
  if (!existsSync(FILE)) return { active: false, triggers: [] };
  try { return JSON.parse(readFileSync(FILE, 'utf8')); }
  catch { return { active: false, triggers: [] }; }
}

function save(data) {
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let state = load();

export const AutoBlock = {
  check(sock, sender, body) {
    if (!state.active) return;
    const lower = body.toLowerCase();
    for (const t of state.triggers) {
      if (lower.includes(t)) {
        sock.updateBlockStatus(sender, 'block').catch(() => {});
        break;
      }
    }
  },
};

export async function handleAutoBlock(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'on')  { state.active = true;  save(state); return reply(sock, msg, '✅ Auto-block ON'); }
  if (sub === 'off') { state.active = false; save(state); return reply(sock, msg, '❌ Auto-block OFF'); }

  if (sub === 'add') {
    const word = args.slice(1).join(' ').toLowerCase();
    if (!word) return reply(sock, msg, 'Usage: .autoblock add [word]');
    state.triggers.push(word);
    save(state);
    return reply(sock, msg, `✅ Trigger added: "${word}"`);
  }

  if (sub === 'remove') {
    const word = args.slice(1).join(' ').toLowerCase();
    state.triggers = state.triggers.filter(t => t !== word);
    save(state);
    return reply(sock, msg, `✅ Trigger removed: "${word}"`);
  }

  if (sub === 'list') {
    return reply(sock, msg,
      `Auto-block: ${state.active ? 'ON' : 'OFF'}\nTriggers: ${state.triggers.join(', ') || 'none'}`
    );
  }

  await reply(sock, msg,
    '.autoblock on/off\n.autoblock add [word]\n.autoblock remove [word]\n.autoblock list'
  );
}
