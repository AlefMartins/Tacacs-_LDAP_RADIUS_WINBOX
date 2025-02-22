const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  createSession(userId, deviceId) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId,
      deviceId,
      startTime: new Date(),
      lastActivity: new Date()
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  removeSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  getUserSessions(userId) {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId);
  }

  cleanInactiveSessions(maxInactiveTime = 30 * 60 * 1000) { // 30 minutos
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxInactiveTime) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = new SessionManager();