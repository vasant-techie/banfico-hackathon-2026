export function formatCurrency(amount, currency = 'GBP') {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
