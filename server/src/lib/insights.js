const KEYWORD_CATEGORIES = [
  { category: 'Groceries', keywords: ['tesco', 'sainsbury', 'asda', 'aldi', 'lidl', 'waitrose', 'morrisons', 'grocery', 'supermarket'] },
  { category: 'Dining', keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'kfc', 'pizza', 'deliveroo', 'uber eats', 'just eat'] },
  { category: 'Transport', keywords: ['uber', 'lyft', 'taxi', 'transport', 'train', 'tfl', 'rail', 'fuel', 'petrol', 'parking'] },
  { category: 'Utilities', keywords: ['electric', 'gas bill', 'water', 'utility', 'utilities', 'broadband', 'council tax'] },
  { category: 'Entertainment', keywords: ['netflix', 'spotify', 'disney', 'cinema', 'movie', 'prime video', 'youtube premium'] },
  { category: 'Subscriptions', keywords: ['subscription', 'membership', 'gym'] },
  { category: 'Shopping', keywords: ['amazon', 'ebay', 'store', 'shop', 'retail'] },
  { category: 'Rent/Mortgage', keywords: ['rent', 'mortgage', 'landlord'] },
];

const MCC_CATEGORIES = {
  5411: 'Groceries',
  5412: 'Groceries',
  5812: 'Dining',
  5814: 'Dining',
  4111: 'Transport',
  4121: 'Transport',
  4900: 'Utilities',
  5815: 'Entertainment',
  5816: 'Entertainment',
  5999: 'Shopping',
  5311: 'Shopping',
  7995: 'Entertainment',
};

const TRANSACTION_CODE_LABELS = {
  ReceivedCreditTransfer: 'Income',
  IssuedCreditTransfer: 'Transfer',
  Payment: 'Payment',
  Purchase: 'Shopping',
};

function textCategory(transactionInformation, merchantName) {
  const haystack = `${merchantName || ''} ${transactionInformation || ''}`.toLowerCase();
  for (const { category, keywords } of KEYWORD_CATEGORIES) {
    if (keywords.some((kw) => haystack.includes(kw))) return category;
  }
  return null;
}

export function categorize(txn) {
  const isCredit = txn.CreditDebitIndicator === 'Credit';
  const code = txn.BankTransactionCode?.Code;

  if (isCredit && (code === 'ReceivedCreditTransfer' || /salary|payroll|wage/i.test(txn.TransactionInformation || ''))) {
    return 'Income';
  }

  const byText = textCategory(txn.TransactionInformation, txn.MerchantDetails?.MerchantName);
  if (byText) return byText;

  const mcc = Number(txn.MerchantDetails?.MerchantCategoryCode);
  if (MCC_CATEGORIES[mcc]) return MCC_CATEGORIES[mcc];

  if (code && TRANSACTION_CODE_LABELS[code]) return TRANSACTION_CODE_LABELS[code];

  return isCredit ? 'Income' : 'Other';
}

function amountOf(txn) {
  return Math.abs(Number(txn.Amount?.Amount ?? 0));
}

function monthKey(txn) {
  const date = txn.BookingDateTime || txn.ValueDateTime;
  return date ? date.slice(0, 7) : 'unknown';
}

export function computeTotals(transactions) {
  let income = 0;
  let expense = 0;
  for (const txn of transactions) {
    const amount = amountOf(txn);
    if (txn.CreditDebitIndicator === 'Credit') income += amount;
    else expense += amount;
  }
  return { income, expense, net: income - expense };
}

export function categoryBreakdown(transactions) {
  const totals = new Map();
  for (const txn of transactions) {
    if (txn.CreditDebitIndicator === 'Credit') continue; // spending only
    const category = categorize(txn);
    totals.set(category, (totals.get(category) || 0) + amountOf(txn));
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);
}

export function monthlyTrend(transactions) {
  const byMonth = new Map();
  for (const txn of transactions) {
    const key = monthKey(txn);
    if (!byMonth.has(key)) byMonth.set(key, { month: key, income: 0, expense: 0 });
    const bucket = byMonth.get(key);
    const amount = amountOf(txn);
    if (txn.CreditDebitIndicator === 'Credit') bucket.income += amount;
    else bucket.expense += amount;
  }
  return [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, income: Number(m.income.toFixed(2)), expense: Number(m.expense.toFixed(2)) }));
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(values, avg) {
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
}

export function detectAnomalies(transactions) {
  const spending = transactions.filter((t) => t.CreditDebitIndicator !== 'Credit');
  const byCategory = new Map();
  for (const txn of spending) {
    const category = categorize(txn);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(txn);
  }

  const anomalies = [];
  for (const [category, txns] of byCategory) {
    const amounts = txns.map(amountOf);
    if (txns.length >= 5) {
      const avg = mean(amounts);
      const sd = stddev(amounts, avg);
      txns.forEach((txn, i) => {
        if (sd > 0 && amounts[i] > avg + 2 * sd) {
          anomalies.push({ transaction: txn, category, reason: 'unusually high vs category average' });
        }
      });
    } else {
      const med = median(amounts);
      txns.forEach((txn, i) => {
        if (med > 0 && amounts[i] > med * 3) {
          anomalies.push({ transaction: txn, category, reason: 'unusually high vs category median' });
        }
      });
    }
  }
  return anomalies;
}

export function detectSubscriptions(transactions) {
  const spending = transactions.filter((t) => t.CreditDebitIndicator !== 'Credit');
  const byMerchant = new Map();
  for (const txn of spending) {
    const merchant = txn.MerchantDetails?.MerchantName || txn.TransactionInformation || 'Unknown';
    if (!byMerchant.has(merchant)) byMerchant.set(merchant, []);
    byMerchant.get(merchant).push(txn);
  }

  const subscriptions = [];
  for (const [merchant, txns] of byMerchant) {
    if (txns.length < 2) continue;
    const amounts = txns.map(amountOf);
    const avg = mean(amounts);
    const consistentAmount = amounts.every((a) => Math.abs(a - avg) < avg * 0.1 + 0.01);
    if (consistentAmount) {
      subscriptions.push({
        merchant,
        averageAmount: Number(avg.toFixed(2)),
        occurrences: txns.length,
      });
    }
  }
  return subscriptions;
}

export function financialHealth({ income, expense }) {
  if (income <= 0) {
    return { label: 'Unknown', ratio: null };
  }
  const ratio = expense / income;
  let label = 'Healthy';
  if (ratio > 1) label = 'At risk';
  else if (ratio > 0.8) label = 'Watch';
  return { label, ratio: Number(ratio.toFixed(2)) };
}

export function buildInsights(transactions) {
  const totals = computeTotals(transactions);
  return {
    totals,
    categoryBreakdown: categoryBreakdown(transactions),
    monthlyTrend: monthlyTrend(transactions),
    anomalies: detectAnomalies(transactions),
    subscriptions: detectSubscriptions(transactions),
    health: financialHealth(totals),
  };
}
