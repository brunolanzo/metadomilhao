-- Performance indexes for scaling
-- These do NOT modify any existing data, only speed up queries

CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions(family_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_family_type ON transactions(family_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_family_month ON transactions(family_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_family ON categories(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(email, status);
CREATE INDEX IF NOT EXISTS idx_goals_family_month ON goals(family_id, month);
CREATE INDEX IF NOT EXISTS idx_category_budgets_family ON category_budgets(family_id);
