function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function subtotal(items) {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

export function quoteRetail(items) {
  const base = subtotal(items);
  const tax = roundMoney(base * 0.0825);

  return {
    subtotal: base,
    tax,
    total: roundMoney(base + tax)
  };
}

export function quoteWholesale(items) {
  const base = roundMoney(subtotal(items) * 0.9);
  const tax = roundMoney(base * 0.0825);

  return {
    subtotal: base,
    tax,
    total: roundMoney(base + tax)
  };
}
