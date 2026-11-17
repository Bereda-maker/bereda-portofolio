-- Personal Finance & Stewardship Management. Forward-only, additive migration.
-- Seeds policy/category vocabulary only; it creates no personal financial records.
CREATE TABLE IF NOT EXISTS finance_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  primary_currency text NOT NULL DEFAULT 'ETB' CHECK (primary_currency ~ '^[A-Z]{3}$'),
  month_start_day smallint NOT NULL DEFAULT 1 CHECK (month_start_day BETWEEN 1 AND 28),
  ai_enabled boolean NOT NULL DEFAULT false,
  allow_csv_export boolean NOT NULL DEFAULT true,
  allow_print_export boolean NOT NULL DEFAULT true,
  include_private_notes_in_ai boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO finance_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_allocation_plans (
  id serial PRIMARY KEY,
  effective_date date NOT NULL UNIQUE,
  giving_bp integer NOT NULL DEFAULT 1000 CHECK (giving_bp BETWEEN 0 AND 10000),
  essential_bp integer NOT NULL DEFAULT 3000 CHECK (essential_bp BETWEEN 0 AND 10000),
  business_bp integer NOT NULL DEFAULT 3000 CHECK (business_bp BETWEEN 0 AND 10000),
  emergency_bp integer NOT NULL DEFAULT 1500 CHECK (emergency_bp BETWEEN 0 AND 10000),
  investment_bp integer NOT NULL DEFAULT 1000 CHECK (investment_bp BETWEEN 0 AND 10000),
  learning_bp integer NOT NULL DEFAULT 1000 CHECK (learning_bp BETWEEN 0 AND 10000),
  enjoyment_bp integer NOT NULL DEFAULT 500 CHECK (enjoyment_bp BETWEEN 0 AND 10000),
  explanation text NOT NULL DEFAULT 'Default Entrepreneur’s Monthly Financial Spending Plan',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (essential_bp + business_bp + emergency_bp + investment_bp + learning_bp + enjoyment_bp = 10000)
);
INSERT INTO finance_allocation_plans (effective_date) VALUES ('1970-01-01') ON CONFLICT (effective_date) DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_categories (
  key text PRIMARY KEY CHECK (key ~ '^[A-Z][A-Z0-9_]{1,39}$'),
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO finance_categories (key,name,description,is_default,sort_order) VALUES
 ('GIVING','Giving to God','First allocation from total received income.',true,1),
 ('ESSENTIAL','Essential living expenses','30% of the remaining 90%.',true,2),
 ('BUSINESS','Business reinvestment','30% of the remaining 90%.',true,3),
 ('EMERGENCY','Emergency savings','15% of the remaining 90%.',true,4),
 ('LONG_TERM_INVESTMENT','Long-term investments','10% of the remaining 90%.',true,5),
 ('LEARNING','Learning and skill development','10% of the remaining 90%.',true,6),
 ('ENJOYMENT','Personal enjoyment','5% of the remaining 90%.',true,7)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_subcategories (
  id serial PRIMARY KEY,
  category_key text NOT NULL REFERENCES finance_categories(key) ON UPDATE CASCADE ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_key,name)
);
INSERT INTO finance_subcategories(category_key,name,is_default,sort_order) VALUES
 ('ESSENTIAL','Rent and housing',true,1),('ESSENTIAL','Food and groceries',true,2),('ESSENTIAL','Transportation and fuel',true,3),('ESSENTIAL','Electricity and water bills',true,4),('ESSENTIAL','Mobile data and internet',true,5),('ESSENTIAL','Personal hygiene',true,6),('ESSENTIAL','Necessary clothing',true,7),('ESSENTIAL','Basic medical expenses',true,8),('ESSENTIAL','Other essential expenses',true,9),
 ('BUSINESS','Website domain and hosting',true,1),('BUSINESS','Software subscriptions',true,2),('BUSINESS','Digital tools',true,3),('BUSINESS','Marketing and advertising',true,4),('BUSINESS','Computer equipment',true,5),('BUSINESS','Product development and testing',true,6),('BUSINESS','Customer acquisition',true,7),('BUSINESS','Freelancers and employees',true,8),('BUSINESS','Business supplies',true,9),('BUSINESS','Other operating expenses',true,10),
 ('LONG_TERM_INVESTMENT','Regulated savings product',true,1),('LONG_TERM_INVESTMENT','Fixed-term deposit',true,2),('LONG_TERM_INVESTMENT','Diversified investment fund',true,3),('LONG_TERM_INVESTMENT','Retirement savings',true,4),('LONG_TERM_INVESTMENT','Other manually tracked investment',true,5),
 ('LEARNING','Programming courses',true,1),('LEARNING','Software development books',true,2),('LEARNING','Business and finance books',true,3),('LEARNING','Digital marketing training',true,4),('LEARNING','Communication and negotiation',true,5),('LEARNING','Professional certifications',true,6),('LEARNING','Mentorship',true,7),('LEARNING','Workshops',true,8),('LEARNING','Technical training',true,9),
 ('ENJOYMENT','Coffee and occasional meals out',true,1),('ENJOYMENT','Entertainment',true,2),('ENJOYMENT','Hobbies',true,3),('ENJOYMENT','Social activities',true,4),('ENJOYMENT','Personal shopping',true,5),('ENJOYMENT','Gifts',true,6),('ENJOYMENT','Leisure and relaxation',true,7)
ON CONFLICT (category_key,name) DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_goals (
  id serial PRIMARY KEY,
  goal_type text NOT NULL DEFAULT 'GOAL' CHECK (goal_type IN ('GOAL','EMERGENCY')),
  title text NOT NULL,
  target_minor numeric(30,0) NOT NULL CHECK (target_minor > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  deadline date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_one_active_emergency_goal_idx ON finance_goals(currency) WHERE goal_type='EMERGENCY' AND is_active;

CREATE TABLE IF NOT EXISTS finance_investments (
  id serial PRIMARY KEY,
  name text NOT NULL,
  investment_category text NOT NULL,
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  current_value_minor numeric(30,0) CHECK (current_value_minor IS NULL OR current_value_minor >= 0),
  value_as_of date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_income (
  id serial PRIMARY KEY,
  title text NOT NULL,
  amount_minor numeric(30,0) NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  source text NOT NULL,
  received_at date NOT NULL,
  description text,
  payment_method text,
  attachment_label text,
  attachment_url text,
  status text NOT NULL DEFAULT 'EXPECTED' CHECK (status IN ('EXPECTED','RECEIVED','CANCELLED')),
  allocation_revision integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_income_status_date_idx ON finance_income(status,received_at);

CREATE TABLE IF NOT EXISTS finance_allocation_runs (
  id serial PRIMARY KEY,
  income_id integer NOT NULL REFERENCES finance_income(id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  plan_id integer NOT NULL REFERENCES finance_allocation_plans(id) ON DELETE RESTRICT,
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  income_amount_minor numeric(30,0) NOT NULL CHECK (income_amount_minor > 0),
  giving_amount_minor numeric(30,0) NOT NULL CHECK (giving_amount_minor >= 0),
  policy_snapshot jsonb NOT NULL,
  reason text NOT NULL DEFAULT 'Income received',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (income_id,revision)
);
CREATE INDEX IF NOT EXISTS finance_allocation_runs_income_idx ON finance_allocation_runs(income_id,revision DESC);
CREATE TABLE IF NOT EXISTS finance_allocations (
  id serial PRIMARY KEY,
  run_id integer NOT NULL REFERENCES finance_allocation_runs(id) ON DELETE RESTRICT,
  category_key text NOT NULL REFERENCES finance_categories(key) ON DELETE RESTRICT,
  amount_minor numeric(30,0) NOT NULL CHECK (amount_minor >= 0),
  share_bp integer NOT NULL CHECK (share_bp BETWEEN 0 AND 10000),
  UNIQUE (run_id,category_key)
);

CREATE TABLE IF NOT EXISTS finance_budget_adjustments (
  id serial PRIMARY KEY,
  category_key text NOT NULL REFERENCES finance_categories(key) ON DELETE RESTRICT,
  amount_minor numeric(30,0) NOT NULL CHECK (amount_minor <> 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  effective_date date NOT NULL,
  explanation text NOT NULL CHECK (length(trim(explanation)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id serial PRIMARY KEY,
  title text NOT NULL,
  amount_minor numeric(30,0) NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  transaction_type text NOT NULL CHECK (transaction_type IN ('INCOME','EXPENSE','TRANSFER','SAVINGS_CONTRIBUTION','SAVINGS_WITHDRAWAL','INVESTMENT_CONTRIBUTION','INVESTMENT_WITHDRAWAL','GIVING')),
  category_key text REFERENCES finance_categories(key) ON DELETE RESTRICT,
  transfer_to_category_key text REFERENCES finance_categories(key) ON DELETE RESTRICT,
  subcategory_id integer REFERENCES finance_subcategories(id) ON DELETE SET NULL,
  transaction_date date NOT NULL,
  payment_method text,
  description text,
  attachment_label text,
  attachment_url text,
  source_income_id integer REFERENCES finance_income(id) ON DELETE RESTRICT,
  goal_id integer REFERENCES finance_goals(id) ON DELETE RESTRICT,
  investment_id integer REFERENCES finance_investments(id) ON DELETE RESTRICT,
  project_id integer REFERENCES projects(id) ON DELETE SET NULL,
  learning_experience_id integer REFERENCES learning_experiences(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (transaction_type <> 'TRANSFER' OR (category_key IS NOT NULL AND transfer_to_category_key IS NOT NULL AND category_key <> transfer_to_category_key)),
  CHECK (transaction_type <> 'INCOME' OR source_income_id IS NOT NULL),
  CHECK (transaction_type NOT IN ('SAVINGS_CONTRIBUTION','SAVINGS_WITHDRAWAL') OR goal_id IS NOT NULL),
  CHECK (transaction_type NOT IN ('INVESTMENT_CONTRIBUTION','INVESTMENT_WITHDRAWAL') OR investment_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_transactions_source_income_unique ON finance_transactions(source_income_id) WHERE source_income_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS finance_transactions_date_type_idx ON finance_transactions(transaction_date,transaction_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS finance_transactions_category_idx ON finance_transactions(category_key,currency,transaction_date) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS finance_income_history (
  id serial PRIMARY KEY,
  income_id integer NOT NULL REFERENCES finance_income(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS_CHANGE')),
  before_snapshot jsonb,
  after_snapshot jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_income_history_idx ON finance_income_history(income_id,created_at DESC);
CREATE TABLE IF NOT EXISTS finance_transaction_history (
  id serial PRIMARY KEY,
  transaction_id integer NOT NULL REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_transaction_history_idx ON finance_transaction_history(transaction_id,created_at DESC);
