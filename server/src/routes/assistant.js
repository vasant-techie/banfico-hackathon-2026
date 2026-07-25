import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { anthropic, model } from '../lib/anthropicClient.js';
import { bankClient, scrubError } from '../lib/bankClient.js';
import { fetchAccounts, fetchTransactions, fetchAllTransactions } from '../lib/bankData.js';
import { buildInsights } from '../lib/insights.js';

const router = Router();
router.use(requireAuth);

const MAX_TOOL_ITERATIONS = 8;

const TOOLS = [
  {
    name: 'get_accounts',
    description: "List the customer's bank accounts (id, nickname, type, currency).",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_balances',
    description: 'Get the current balance for one account.',
    input_schema: {
      type: 'object',
      properties: { accountId: { type: 'string', description: 'Account id from get_accounts' } },
      required: ['accountId'],
    },
  },
  {
    name: 'get_transactions',
    description: 'Get transaction history for one account, or across all accounts if accountId is omitted.',
    input_schema: {
      type: 'object',
      properties: { accountId: { type: 'string', description: 'Optional account id to scope to a single account' } },
    },
  },
  {
    name: 'get_insights',
    description: 'Get precomputed spending insights: totals, category breakdown, monthly trend, anomalies, subscriptions, health label.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'transfer_to_savings',
    description:
      'Execute a transfer of money from one account to another (e.g. moving spare cash into a savings account). Creates a debit transaction on the source account and a credit transaction on the destination account. Only call this after the user has clearly confirmed the amount and destination.',
    input_schema: {
      type: 'object',
      properties: {
        fromAccountId: { type: 'string', description: 'Account id to debit' },
        toAccountId: { type: 'string', description: 'Account id to credit (e.g. a savings account)' },
        amount: { type: 'number', description: 'Amount to move, in the account currency' },
        description: { type: 'string', description: 'Short human-readable description of the transfer' },
      },
      required: ['fromAccountId', 'toAccountId', 'amount'],
    },
  },
];

function buildTransactionPayload({ amount, currency, creditDebitIndicator, information }) {
  const now = new Date().toISOString();
  const reference = `txn-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return {
    TransactionReference: reference,
    Amount: { Amount: amount.toFixed(2), Currency: currency },
    CreditDebitIndicator: creditDebitIndicator,
    Status: 'PDNG',
    BookingDateTime: now,
    ValueDateTime: now,
    TransactionInformation: information || 'Smart transfer',
    BankTransactionCode: {
      Code: creditDebitIndicator === 'Credit' ? 'ReceivedCreditTransfer' : 'IssuedCreditTransfer',
      SubCode: 'AutomaticTransfer',
    },
    ProprietaryBankTransactionCode: { Code: 'Transfer', Issuer: 'CoreBank' },
    Balance: {
      Amount: { Amount: amount.toFixed(2), Currency: currency },
      CreditDebitIndicator: creditDebitIndicator,
      Type: 'ITBD',
    },
    PaymentPurposeCode: 'CASH',
  };
}

function toolExecutors(token) {
  return {
    async get_accounts() {
      return await fetchAccounts(token);
    },
    async get_balances({ accountId }) {
      const { data } = await bankClient(token).get(`/accounts/${accountId}/balances`);
      return data;
    },
    async get_transactions({ accountId }) {
      if (accountId) return await fetchTransactions(token, accountId);
      const accounts = await fetchAccounts(token);
      return await fetchAllTransactions(token, accounts);
    },
    async get_insights() {
      const accounts = await fetchAccounts(token);
      const transactions = await fetchAllTransactions(token, accounts);
      return buildInsights(transactions);
    },
    async transfer_to_savings({ fromAccountId, toAccountId, amount, description }) {
      const currency = 'GBP';
      const debit = buildTransactionPayload({
        amount,
        currency,
        creditDebitIndicator: 'Debit',
        information: description,
      });
      const credit = buildTransactionPayload({
        amount,
        currency,
        creditDebitIndicator: 'Credit',
        information: description,
      });
      const client = bankClient(token);
      const [debitRes, creditRes] = await Promise.all([
        client.post(`/accounts/${fromAccountId}/transactions`, debit),
        client.post(`/accounts/${toAccountId}/transactions`, credit),
      ]);
      return {
        executed: true,
        amount,
        fromAccountId,
        toAccountId,
        debitTransaction: debitRes.data,
        creditTransaction: creditRes.data,
      };
    },
  };
}

const SYSTEM_PROMPT = `You are a helpful, concise financial assistant embedded in a fintech dashboard. You have tools to read the user's real account data (accounts, balances, transactions, insights) and to execute a transfer via transfer_to_savings. Rules:
- Ground every factual claim about money in a tool call — never guess balances or transactions.
- Before calling transfer_to_savings, restate the amount and destination account so the user knows what you're about to do. The application will separately require the user to explicitly confirm the transfer in the UI before it is executed, so you do not need to ask again once you call the tool.
- Keep answers short and conversational, suitable for a chat bubble UI.`;

function extractText(response) {
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

async function resolveToolBlock(block, executors, decision, executedActions) {
  try {
    if (block.name === 'transfer_to_savings' && decision && !decision.approved) {
      return {
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify({ executed: false, reason: 'The user declined this transfer.' }),
      };
    }
    const executor = executors[block.name];
    const result = executor ? await executor(block.input || {}) : { error: `Unknown tool ${block.name}` };
    if (block.name === 'transfer_to_savings' && result?.executed) executedActions.push(result);
    return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
  } catch (err) {
    const { body } = scrubError(err);
    return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify({ error: body }), is_error: true };
  }
}

router.post('/chat', async (req, res) => {
  const { message, history, confirm } = req.body || {};
  if (!confirm && !message) return res.status(400).json({ error: 'message is required' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const executors = toolExecutors(req.accessToken);
  const messages = Array.isArray(history) ? [...history] : [];
  const executedActions = [];

  try {
    if (confirm) {
      // The previous turn paused with a pending transfer_to_savings tool_use; resolve it now.
      const lastAssistantTurn = messages[messages.length - 1];
      const pendingBlocks = (lastAssistantTurn?.content || []).filter((block) => block.type === 'tool_use');
      if (lastAssistantTurn?.role !== 'assistant' || !pendingBlocks.length) {
        return res.status(400).json({ error: 'No pending action to confirm' });
      }
      const toolResults = await Promise.all(
        pendingBlocks.map((block) => resolveToolBlock(block, executors, confirm, executedActions))
      );
      messages.push({ role: 'user', content: toolResults });
    } else {
      messages.push({ role: 'user', content: message });
    }

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason !== 'tool_use') {
        return res.json({
          reply: extractText(response),
          history: [...messages, { role: 'assistant', content: response.content }],
          executedActions,
        });
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');
      const needsConfirmation = toolUseBlocks.find((block) => block.name === 'transfer_to_savings');

      if (needsConfirmation) {
        // Pause the whole turn — nothing in it (including any read-only calls bundled alongside)
        // executes until the client sends an explicit confirm/cancel.
        return res.json({
          reply: extractText(response) || "I'll need your confirmation before I move any money.",
          pendingAction: { toolUseId: needsConfirmation.id, name: needsConfirmation.name, input: needsConfirmation.input },
          history: messages,
          executedActions,
        });
      }

      const toolResults = await Promise.all(
        toolUseBlocks.map((block) => resolveToolBlock(block, executors, null, executedActions))
      );
      messages.push({ role: 'user', content: toolResults });
    }

    res.status(502).json({ error: 'Assistant did not converge in time' });
  } catch (err) {
    const { status, body } = scrubError(err);
    res.status(status).json({ error: 'Assistant request failed', details: body });
  }
});

export default router;
