// lang: JavaScript, file: lib/presence.js
// Tracks contact online/offline presence for the spy feature

const log = new Map(); // jid → [{ status, timestamp }]
const watching = new Set();

export const PresenceTracker = {
  watch(jid) {
    watching.add(jid);
    if (!log.has(jid)) log.set(jid, []);
  },

  unwatch(jid) {
    watching.delete(jid);
  },

  isWatching(jid) {
    return watching.has(jid);
  },

  update(jid, presences) {
    if (!watching.has(jid)) return;

    const entries = log.get(jid) || [];
    for (const [participant, presence] of Object.entries(presences)) {
      entries.push({
        participant,
        status:    presence.lastKnownPresence,
        timestamp: Date.now(),
      });
      // Keep last 100 entries
      if (entries.length > 100) entries.shift();
    }
    log.set(jid, entries);
  },

  getLog(jid) {
    return log.get(jid) || [];
  },

  watching() {
    return [...watching];
  },

  formatLog(jid) {
    const entries = log.get(jid) || [];
    if (!entries.length) return 'No activity logged yet.';
    return entries
      .slice(-20)
      .map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        return `[${time}] ${e.participant.replace('@s.whatsapp.net', '')} → ${e.status}`;
      })
      .join('\n');
  },
};
