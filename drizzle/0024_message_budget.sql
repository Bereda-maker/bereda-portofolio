-- Contact form: optional estimated budget. Additive and nullable, so existing
-- messages are untouched and old rows simply have no budget.
ALTER TABLE messages
  ADD COLUMN budget_amount integer,
  ADD COLUMN budget_currency text;

ALTER TABLE messages
  ADD CONSTRAINT messages_budget_check CHECK (
    (budget_amount IS NULL AND budget_currency IS NULL)
    OR (budget_amount IS NOT NULL AND budget_amount >= 0 AND budget_currency ~ '^[A-Z]{3}$')
  );
