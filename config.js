// lang: JavaScript, file: config.js
// Central config — edit before running

export const CONFIG = {
  // Your WhatsApp number (with country code, no +)
  OWNER_NUMBER: '263784970429',

  // Bot name displayed in messages
  BOT_NAME: 'Evilyamicrush',

  // Command prefix
  PREFIX: '.',

  // Auto-reply: respond to all messages or only mentions
  AUTO_REPLY_ALL: false,

  // Ghost mode on startup
  GHOST_MODE: false,

  // Anti-read receipts on startup  
  ANTI_READ: true,

  // Anti-delete on startup
  ANTI_DELETE: true,

  // Anti-revoke (catch edits) on startup
  ANTI_REVOKE: true,

  // Auto status viewer on startup
  AUTO_STATUS_VIEW: true,

  // Max bug spam count (safety cap)
  BUG_SPAM_MAX: 50,

  // Delay floor for spamming (ms) — below 200 gets flagged server-side
  SPAM_DELAY_FLOOR: 200,

  // Data directory
  DATA_DIR: './data',

  // Session directory
  SESSION_DIR: './session',
};
