import { httpClient } from './httpClient.js';

function unwrap(data, key) {
  return data?.Data?.[key] ?? (Array.isArray(data) ? data : []);
}

async function retryOnce(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.response?.status >= 500 || !err.response) return await fn();
    throw err;
  }
}

export async function refreshToken(refresh_token) {
  const { data } = await httpClient.post('/auth/refresh', { refresh_token });
  return data;
}

export async function listAccounts() {
  const { data } = await retryOnce(() => httpClient.get('/accounts'));
  return unwrap(data, 'Account');
}

export async function getAccount(accountId) {
  const { data } = await retryOnce(() => httpClient.get(`/accounts/${accountId}`));
  return unwrap(data, 'Account')[0] || null;
}

export async function getBalances(accountId) {
  const { data } = await retryOnce(() => httpClient.get(`/accounts/${accountId}/balances`));
  return unwrap(data, 'Balance');
}

export async function listTransactions(accountId) {
  const { data } = await retryOnce(() => httpClient.get(`/accounts/${accountId}/transactions`));
  return unwrap(data, 'Transaction');
}

export async function createTransaction(accountId, payload) {
  const { data } = await httpClient.post(`/accounts/${accountId}/transactions`, payload);
  return data;
}

export async function getInsights() {
  const { data } = await retryOnce(() => httpClient.get('/insights'));
  return data;
}

export async function chat(message, history) {
  const { data } = await httpClient.post('/assistant/chat', { message, history });
  return data;
}

export async function confirmChatAction(history, toolUseId, approved) {
  const { data } = await httpClient.post('/assistant/chat', {
    history,
    confirm: { toolUseId, approved },
  });
  return data;
}
