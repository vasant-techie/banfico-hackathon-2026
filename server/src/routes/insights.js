import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { fetchAccountsAndTransactions } from '../lib/bankData.js';
import { buildInsights } from '../lib/insights.js';
import { anthropic, model } from '../lib/anthropicClient.js';
import { scrubError } from '../lib/bankClient.js';

const router = Router();
router.use(requireAuth);

async function narrate(insights) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return 'Add an ANTHROPIC_API_KEY to enable AI-generated financial narratives.';
  }
  const { totals, categoryBreakdown, health, anomalies, subscriptions } = insights;
  const prompt = `You are a financial coach. Given this precomputed data for a bank customer, write a short (3-4 sentence), plain-English, encouraging-but-honest summary of their financial health. Do not invent numbers beyond what's given.

Income: ${totals.income}
Expense: ${totals.expense}
Net: ${totals.net}
Health label: ${health.label} (spend/income ratio: ${health.ratio})
Top spending categories: ${categoryBreakdown.slice(0, 5).map((c) => `${c.category}: ${c.total}`).join(', ') || 'none'}
Unusual transactions detected: ${anomalies.length}
Likely subscriptions detected: ${subscriptions.length}`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content.find((block) => block.type === 'text')?.text || '';
}

router.get('/', async (req, res) => {
  try {
    const { transactions } = await fetchAccountsAndTransactions(req.accessToken);
    const insights = buildInsights(transactions);
    const narrative = await narrate(insights);
    res.json({ ...insights, narrative });
  } catch (err) {
    const { status, body } = scrubError(err);
    res.status(status).json({ error: 'Failed to compute insights', details: body });
  }
});

export default router;
