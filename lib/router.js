// lang: JavaScript, file: lib/router.js
// Routes incoming messages — owner-only gate on all commands

import { CONFIG } from '../config.js';
import { getBody, getSender, isOwner, react } from './utils.js';

// ── command imports ────────────────────────────────────────────────────────────
import { handleBugCrush }       from '../commands/bugcrush.js';
import { handleGhost }          from '../commands/ghost.js';
import { handleAntiRead }       from '../commands/antiread.js';
import { handleViewOnce }       from '../commands/viewonce.js';
import { handleAutoReply }      from '../commands/autoreply.js';
import { handleBulkSend }       from '../commands/bulksend.js';
import { handleTagAll }         from '../commands/tagall.js';
import { handleFakeReply }      from '../commands/fakereply.js';
import { handleSchedule }       from '../commands/schedule.js';
import { handleForward }        from '../commands/forward.js';
import { handleGroupScrape }    from '../commands/groupscrape.js';
import { handleNumberCheck }    from '../commands/numbercheck.js';
import { handlePresenceSpy }    from '../commands/presencespy.js';
import { handleProfilePic }     from '../commands/profilepic.js';
import { handleStatusDL }       from '../commands/statusdl.js';
import { handleStickerMaker }   from '../commands/sticker.js';
import { handleFilespoof }      from '../commands/filespoof.js';
import { handleMassAdd }        from '../commands/massadd.js';
import { handleMassKick }       from '../commands/masskick.js';
import { handleGroupClone }     from '../commands/groupclone.js';
import { handlePresenceFlood }  from '../commands/presenceflood.js';
import { handleTypingSpoof }    from '../commands/typingspoof.js';
import { handleAutoBlock }      from '../commands/autoblock.js';
import { handleFloodDetect }    from '../commands/flooddetect.js';
import { handleAutoReact }      from '../commands/autoreact.js';
import { handleLastSeenSpoof }  from '../commands/lastseenspoof.js';
import { handleHelp, handlePair } from '../commands/help.js';

// ── passive auto-handlers ─────────────────────────────────────────────────────
import { AutoReply }   from '../commands/autoreply.js';
import { AutoReact }   from '../commands/autoreact.js';
import { FloodDetect } from '../commands/flooddetect.js';
import { AutoBlock }   from '../commands/autoblock.js';

// ── command map ────────────────────────────────────────────────────────────────
const COMMANDS = {
  // Weapons
  bugcrush:      handleBugCrush,
  bug:           handleBugCrush,
  presenceflood: handlePresenceFlood,
  typingspoof:   handleTypingSpoof,
  fakereply:     handleFakeReply,

  // Broadcast
  bulk:          handleBulkSend,
  tagall:        handleTagAll,

  // Group
  massadd:       handleMassAdd,
  masskick:      handleMassKick,
  clone:         handleGroupClone,
  scrape:        handleGroupScrape,

  // Stealth
  ghost:         handleGhost,
  antiread:      handleAntiRead,
  lastseen:      handleLastSeenSpoof,

  // Extract
  viewonce:      handleViewOnce,
  statusdl:      handleStatusDL,
  pfp:           handleProfilePic,

  // Recon
  spy:           handlePresenceSpy,
  checknum:      handleNumberCheck,

  // Automation
  autoreply:     handleAutoReply,
  autoreact:     handleAutoReact,
  schedule:      handleSchedule,
  forward:       handleForward,

  // Defense
  autoblock:     handleAutoBlock,
  flooddetect:   handleFloodDetect,

  // Media
  sticker:       handleStickerMaker,
  spoof:         handleFilespoof,

  // System
  pair:          handlePair,
  help:          handleHelp,
  menu:          handleHelp,
};

// ── router ─────────────────────────────────────────────────────────────────────
export async function handleMessage(sock, msg) {
  const body   = getBody(msg);
  const sender = getSender(msg);
  const jid    = msg.key.remoteJid;

  if (!body) return;

  // ── passive handlers — run for everyone ───────────────────────────────────
  AutoReply.check(sock, msg, body, sender, jid);
  AutoReact.check(sock, msg, body);
  FloodDetect.check(sock, msg, sender, jid);
  AutoBlock.check(sock, sender, body);

  // ── command gate ──────────────────────────────────────────────────────────
  if (!body.startsWith(CONFIG.PREFIX)) return;

  // OWNER-ONLY — non-owners get absolute silence (no error, no hint)
  if (!isOwner(sender)) return;

  const [rawCmd, ...args] = body.slice(CONFIG.PREFIX.length).trim().split(/\s+/);
  const cmd = rawCmd.toLowerCase();

  const handler = COMMANDS[cmd];
  if (!handler) return; // unknown command — silent to owner too (clean)

  await react(sock, msg, '💀');
  await handler(sock, msg, args, jid, sender);
}
