-- Meals & Nutrition: additive, forward-only schema; no sample foods or personal records.
CREATE TABLE meals_foods (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  piece_count numeric(20,6),
  total_weight numeric(20,6),
  total_weight_unit text,
  price_minor numeric(30,0),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  price_unit text,
  preparation text,
  availability text NOT NULL DEFAULT 'AVAILABLE',
  expires_at date,
  image_ref text,
  notes text,
  allergens text[] NOT NULL DEFAULT '{}',
  diet_tags text[] NOT NULL DEFAULT '{}',
  restrictions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((total_weight IS NULL) = (total_weight_unit IS NULL)),
  CHECK (price_minor IS NULL OR price_minor >= 0)
);
CREATE INDEX meals_foods_owner_category_idx ON meals_foods(owner_key,category);
CREATE INDEX meals_foods_owner_availability_idx ON meals_foods(owner_key,availability);

CREATE TABLE meals_nutrition_profiles (
  id serial PRIMARY KEY,
  food_id integer NOT NULL REFERENCES meals_foods(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  basis_type text NOT NULL CHECK (basis_type IN ('100g','100ml','serving')),
  serving_name text,
  serving_quantity numeric(20,6),
  serving_unit text,
  nutrients jsonb NOT NULL,
  nutrient_units jsonb NOT NULL DEFAULT '{}',
  source text,
  provenance jsonb NOT NULL DEFAULT '{}',
  confidence numeric(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((basis_type = 'serving') = (serving_name IS NOT NULL)),
  CHECK ((serving_quantity IS NULL) = (serving_unit IS NULL)),
  CONSTRAINT meals_nutrition_profiles_food_id_version_unique UNIQUE(food_id,version)
);
CREATE INDEX meals_nutrition_profiles_food_effective_idx ON meals_nutrition_profiles(food_id,effective_at DESC);

CREATE TABLE meals_inventory_lots (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  food_id integer NOT NULL REFERENCES meals_foods(id) ON DELETE RESTRICT,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  purchased_quantity numeric(20,6) NOT NULL,
  available_quantity numeric(20,6) NOT NULL,
  consumed_quantity numeric(20,6) NOT NULL DEFAULT 0,
  quantity_unit text NOT NULL,
  purchased_pieces numeric(20,6) NOT NULL DEFAULT 0,
  available_pieces numeric(20,6) NOT NULL DEFAULT 0,
  consumed_pieces numeric(20,6) NOT NULL DEFAULT 0,
  purchased_weight numeric(20,6),
  available_weight numeric(20,6),
  consumed_weight numeric(20,6) NOT NULL DEFAULT 0,
  weight_unit text,
  price_minor numeric(30,0) NOT NULL,
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  expires_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (purchased_quantity >= 0 AND available_quantity >= 0 AND consumed_quantity >= 0),
  CHECK (purchased_pieces >= 0 AND available_pieces >= 0 AND consumed_pieces >= 0),
  CHECK (price_minor >= 0),
  CHECK ((purchased_weight IS NULL) = (weight_unit IS NULL)),
  CHECK ((purchased_weight IS NULL) = (available_weight IS NULL))
);
CREATE INDEX meals_inventory_lots_owner_food_idx ON meals_inventory_lots(owner_key,food_id);
CREATE INDEX meals_inventory_lots_expiry_idx ON meals_inventory_lots(owner_key,expires_at);

CREATE TABLE meals_inventory_events (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  lot_id integer NOT NULL REFERENCES meals_inventory_lots(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  quantity_delta numeric(20,6) NOT NULL DEFAULT 0,
  quantity_unit text NOT NULL,
  pieces_delta numeric(20,6) NOT NULL DEFAULT 0,
  weight_delta numeric(20,6),
  weight_unit text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((weight_delta IS NULL) = (weight_unit IS NULL))
);
CREATE UNIQUE INDEX meals_inventory_events_idempotency_unique ON meals_inventory_events(owner_key,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX meals_inventory_events_lot_time_idx ON meals_inventory_events(lot_id,occurred_at DESC);

CREATE TABLE meals_body_profiles (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  height numeric(10,4),
  height_unit text,
  birth_date date,
  age_years integer CHECK (age_years IS NULL OR age_years BETWEEN 0 AND 120),
  age_as_of date,
  sex text,
  activity_level text,
  preferences jsonb NOT NULL DEFAULT '{}',
  restrictions text[] NOT NULL DEFAULT '{}',
  private_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meals_body_profiles_owner_key_unique UNIQUE(owner_key)
);

CREATE TABLE meals_daily_budgets (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  budget_date date NOT NULL,
  amount_minor numeric(30,0) NOT NULL CHECK (amount_minor >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  meals_count integer NOT NULL DEFAULT 3 CHECK (meals_count BETWEEN 1 AND 10),
  calorie_target numeric(20,6),
  nutrient_targets jsonb NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meals_daily_budgets_owner_key_budget_date_unique UNIQUE(owner_key,budget_date)
);

CREATE TABLE meals_plans (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  plan_date date NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  input_snapshot jsonb NOT NULL,
  nutrition_snapshot jsonb NOT NULL,
  cost_minor numeric(30,0),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meals_plans_owner_date_idx ON meals_plans(owner_key,plan_date DESC);

CREATE TABLE meals_plan_items (
  id serial PRIMARY KEY,
  plan_id integer NOT NULL REFERENCES meals_plans(id) ON DELETE CASCADE,
  food_id integer NOT NULL REFERENCES meals_foods(id) ON DELETE RESTRICT,
  nutrition_profile_id integer REFERENCES meals_nutrition_profiles(id) ON DELETE SET NULL,
  meal_type text NOT NULL,
  serving_quantity numeric(20,6) NOT NULL,
  serving_unit text NOT NULL,
  serving_pieces numeric(20,6),
  serving_weight numeric(20,6),
  serving_weight_unit text,
  cost_minor numeric(30,0),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  calculated_nutrients jsonb NOT NULL,
  item_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((serving_weight IS NULL) = (serving_weight_unit IS NULL))
);
CREATE INDEX meals_plan_items_plan_order_idx ON meals_plan_items(plan_id,item_order);

CREATE TABLE meals_consumption_events (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  plan_item_id integer REFERENCES meals_plan_items(id) ON DELETE SET NULL,
  food_id integer NOT NULL REFERENCES meals_foods(id) ON DELETE RESTRICT,
  lot_id integer REFERENCES meals_inventory_lots(id) ON DELETE SET NULL,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  meal_type text NOT NULL,
  quantity numeric(20,6) NOT NULL,
  quantity_unit text NOT NULL,
  pieces numeric(20,6),
  weight numeric(20,6),
  weight_unit text,
  cost_minor numeric(30,0),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  nutrition_snapshot jsonb NOT NULL,
  idempotency_key text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((weight IS NULL) = (weight_unit IS NULL))
);
CREATE UNIQUE INDEX meals_consumption_events_idempotency_unique ON meals_consumption_events(owner_key,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX meals_consumption_events_owner_time_idx ON meals_consumption_events(owner_key,consumed_at DESC);

CREATE TABLE meals_favorites (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  food_id integer REFERENCES meals_foods(id) ON DELETE CASCADE,
  plan_id integer REFERENCES meals_plans(id) ON DELETE CASCADE,
  plan_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meals_favorites_item_check CHECK ((food_id IS NOT NULL AND plan_id IS NULL AND plan_snapshot IS NULL) OR (food_id IS NULL AND plan_id IS NOT NULL AND plan_snapshot IS NOT NULL))
);
CREATE UNIQUE INDEX meals_favorites_owner_food_unique ON meals_favorites(owner_key,food_id) WHERE food_id IS NOT NULL;
CREATE UNIQUE INDEX meals_favorites_owner_plan_unique ON meals_favorites(owner_key,plan_id) WHERE plan_id IS NOT NULL;

CREATE TABLE meals_weight_progress (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  weight numeric(20,6) NOT NULL,
  weight_unit text NOT NULL,
  body_fat_percent numeric(7,4),
  measurements jsonb NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meals_weight_progress_owner_time_idx ON meals_weight_progress(owner_key,recorded_at DESC);

CREATE TABLE meals_finance_links (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  finance_transaction_id integer NOT NULL UNIQUE REFERENCES finance_transactions(id) ON DELETE RESTRICT,
  inventory_lot_id integer NOT NULL UNIQUE REFERENCES meals_inventory_lots(id) ON DELETE RESTRICT,
  linked_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE TABLE meals_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  finance_integration_enabled boolean NOT NULL DEFAULT false,
  ai_enabled boolean NOT NULL DEFAULT false,
  sensitive_ai_consent boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO meals_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;


CREATE TABLE meals_hydration_events (
  id serial PRIMARY KEY,
  owner_key text NOT NULL DEFAULT 'admin',
  amount_ml numeric(20,6) NOT NULL CHECK (amount_ml > 0),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meals_hydration_owner_idempotency_unique UNIQUE(owner_key,idempotency_key)
);
CREATE INDEX meals_hydration_owner_time_idx ON meals_hydration_events(owner_key,recorded_at DESC);
