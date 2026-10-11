// lang: JavaScript, file: lib/store.js
// In-memory message store for quoted/replied message resolution

const messageCache = new Map();

export const Store = {
  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (msg.key?.id) {
          messageCache.set(msg.key.id, msg.message);
        }
      }
    });
  },

  getMessage(key) {
    return messageCache.get(key.id) || undefined;
  },

  getByJid(jid) {
    return [...messageCache.entries()]
      .filter(([, msg]) => msg?.key?.remoteJid === jid)
      .map(([, msg]) => msg);
  },

  size() {
    return messageCache.size;
  },
};
