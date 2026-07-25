import 'dotenv/config';

export const config = {
  port: process.env.PORT || 5050,
  bankDomain: process.env.BANK_DOMAIN || 'obiebank-sbx.banfico.io',
  bankTenant: process.env.BANK_TENANT || 'provider',
  clientId: process.env.BANK_CLIENT_ID || 'corebank-spa',
  clientSecret: process.env.BANK_CLIENT_SECRET || 'corebank-spa-password',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
};

export const authBaseUrl = `https://auth.${config.bankDomain}/auth/realms/${config.bankTenant}/protocol/openid-connect/token`;
export const coreApiBaseUrl = `https://core-api.${config.bankDomain}/api/obie-aisp/v4.0`;
