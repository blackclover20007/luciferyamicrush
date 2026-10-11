// lang: JavaScript, file: commands/autoreply.js
// Auto-reply system with custom trigger → response rules

import { reply } from '../lib/utils.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CONFIG } from '../config.js';

const RULES_FILE = `${CONFIG.DATA_DIR}/autoreply.json`;

function loadRules() {
  if (!existsSync(RULES_FILE)) return [];
  try { return JSON.parse(readFileSync(RULES_FILE, 'utf8')); }
  catch { return []; }
}

function saveRules(rules) {
  writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2));
}

let rules = loadRules();
let active = true;

// ── passive checker (called from router) ──────────────────────────────────────

export const AutoReply = {
  check(sock, msg, body, sender, jid) {
    if (!active) return;
    const lower = body.toLowerCase();
    for (const rule of rules) {
      const match = rule.regex
        ? new RegExp(rule.trigger, 'i').test(lower)
        : lower.includes(rule.trigger.toLowerCase());
      if (match) {
        sock.sendMessage(jid, { text: rule.response, quoted: msg }).catch(() => {});
        break;
      }
    }
  },
};

// ── command handler ────────────────────────────────────────────────────────────

export async function handleAutoReply(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'on') {
    active = true;
    return reply(sock, msg, '✅ Auto-reply ON');
  }

  if (sub === 'off') {
    active = false;
    return reply(sock, msg, '❌ Auto-reply OFF');
  }

  if (sub === 'add') {
    // .autoreply add [trigger] | [response]
    const rest = args.slice(1).join(' ');
    const parts = rest.split('|');
    if (parts.length < 2) {
      return reply(sock, msg, 'Usage: .autoreply add trigger | response');
    }
    const trigger  = parts[0].trim();
    const response = parts.slice(1).join('|').trim();
    rules.push({ trigger, response, regex: false });
    saveRules(rules);
    return reply(sock, msg, `✅ Rule added: "${trigger}" → "${response}"`);
  }

  if (sub === 'regex') {
    const rest = args.slice(1).join(' ');
    const parts = rest.split('|');
    if (parts.length < 2) {
      return reply(sock, msg, 'Usage: .autoreply regex pattern | response');
    }
    const trigger  = parts[0].trim();
    const response = parts.slice(1).join('|').trim();
    rules.push({ trigger, response, regex: true });
    saveRules(rules);
    return reply(sock, msg, `✅ Regex rule added: /${trigger}/ → "${response}"`);
  }

  if (sub === 'del') {
    const idx = parseInt(args[1]);
    if (isNaN(idx) || idx < 1 || idx > rules.length) {
      return reply(sock, msg, 'Usage: .autoreply del [rule number]');
    }
    const removed = rules.splice(idx - 1, 1);
    saveRules(rules);
    return reply(sock, msg, `✅ Removed rule: "${removed[0].trigger}"`);
  }

  if (sub === 'list') {
    if (!rules.length) return reply(sock, msg, 'No auto-reply rules set.');
    const list = rules.map((r, i) =>
      `${i + 1}. ${r.regex ? '[regex] ' : ''}${r.trigger} → ${r.response}`
    ).join('\n');
    return reply(sock, msg, `*Auto-Reply Rules:*\n${list}`);
  }

  await reply(sock, msg,
    `*Auto-Reply Commands:*\n` +
    `.autoreply on/off\n` +
    `.autoreply add trigger | response\n` +
    `.autoreply regex pattern | response\n` +
    `.autoreply del [number]\n` +
    `.autoreply list`
  );
}
