require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3001
  },
  ad: {
    url: process.env.AD_URL,
    baseDN: process.env.AD_BASE_DN,
    bindDN: process.env.AD_BIND_DN,
    bindPassword: process.env.AD_BIND_PASSWORD,
    domain: process.env.AD_DOMAIN,
    adminGroups: process.env.AD_ADMIN_GROUPS?.split(',') || [],
    nocGroups: process.env.AD_NOC_GROUPS?.split(',') || [],
    monitorGroups: process.env.AD_MONITOR_GROUPS?.split(',') || []
  },
  tacacs: {
    serverIP: process.env.TACACS_SERVER_IP,
    key: process.env.TACACS_KEY
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'marvitel_tacacs_secret_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  frontend: {
    url: process.env.FRONTEND_URL
  }
};

// Validação das configurações obrigatórias
const requiredEnvVars = [
  'AD_URL',
  'AD_BASE_DN',
  'AD_BIND_DN',
  'AD_BIND_PASSWORD',
  'AD_DOMAIN',
  'TACACS_SERVER_IP',
  'TACACS_KEY',
  'JWT_SECRET',
  'AD_ADMIN_GROUPS',
  'AD_NOC_GROUPS'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Variáveis de ambiente obrigatórias não definidas:', missingEnvVars);
  process.exit(1);
}

module.exports = config;
