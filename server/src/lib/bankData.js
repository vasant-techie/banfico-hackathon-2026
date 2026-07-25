import { bankClient } from './bankClient.js';

function unwrapList(data) {
  return data?.Data?.Account || data?.Data?.Transaction || data?.data || (Array.isArray(data) ? data : []);
}

export async function fetchAccounts(token) {
  const { data } = await bankClient(token).get('/accounts', { params: { type: 'domestic' } });
  return unwrapList(data);
}

export async function fetchTransactions(token, accountId) {
  const { data } = await bankClient(token).get(`/accounts/${accountId}/transactions`);
  return unwrapList(data);
}

export async function fetchAllTransactions(token, accounts) {
  const perAccount = await Promise.all(
    accounts.map(async (account) => {
      const accountId = account.AccountId || account.Id;
      try {
        return await fetchTransactions(token, accountId);
      } catch {
        return [];
      }
    })
  );
  return perAccount.flat();
}

export async function fetchAccountsAndTransactions(token) {
  const accounts = await fetchAccounts(token);
  const transactions = await fetchAllTransactions(token, accounts);
  return { accounts, transactions };
}
