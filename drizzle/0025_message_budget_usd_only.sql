-- Budget is USD-only with a $500 minimum, so the currency column is no longer needed.
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_budget_check;
ALTER TABLE messages DROP COLUMN IF EXISTS budget_currency;
ALTER TABLE messages
  ADD CONSTRAINT messages_budget_check CHECK (budget_amount IS NULL OR budget_amount >= 500);
