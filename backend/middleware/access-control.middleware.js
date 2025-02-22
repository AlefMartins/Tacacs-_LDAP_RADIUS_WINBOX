const logger = require('../utils/logger');

const accessLevels = {
  MONITOR: 5,
  NOC: 10,
  ADMIN: 15
};

const requireAccessLevel = (minimumLevel) => {
  return (req, res, next) => {
    if (req.user.accessLevel < minimumLevel) {
      logger.warn(`Acesso negado: usuário ${req.user.username} (nível ${req.user.accessLevel}) tentou acessar recurso que requer nível ${minimumLevel}`);
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }
    next();
  };
};

const requireGroups = (allowedGroups) => {
  return (req, res, next) => {
    const hasAccess = req.user.groups.some(userGroup =>
      allowedGroups.some(allowedGroup =>
        userGroup.toUpperCase() === allowedGroup.toUpperCase()
      )
    );

    if (!hasAccess) {
      logger.warn(`Acesso negado: usuário ${req.user.username} não pertence aos grupos necessários`);
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }
    next();
  };
};

module.exports = {
  accessLevels,
  requireAccessLevel,
  requireGroups
};