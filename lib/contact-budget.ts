// Shared by the public contact form, the /api/contact route and the admin inbox.
// Budgets are whole US dollars. The slider runs from BUDGET_MIN to BUDGET_MAX in
// BUDGET_STEP steps; a value at BUDGET_MAX means "that or more".
export const BUDGET_MIN = 500;
export const BUDGET_MAX = 10_000;
export const BUDGET_STEP = 500;

export function formatBudget(amount: number | null | undefined): string | null {
  if (amount == null) return null;
  const text = `$${amount.toLocaleString('en-US')}`;
  return amount >= BUDGET_MAX ? `${text}+` : text;
}
