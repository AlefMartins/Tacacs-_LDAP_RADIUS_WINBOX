const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de 5 tentativas
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições
  message: { error: 'Limite de requisições excedido. Tente novamente mais tarde.' }
});

module.exports = {
  authLimiter,
  apiLimiter
};