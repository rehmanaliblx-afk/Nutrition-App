interface Migration {
  version: number;
  up: string[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE IF NOT EXISTS ingredients (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        name             TEXT    NOT NULL UNIQUE,
        carbs_total      REAL    NOT NULL DEFAULT 0,
        carbs_sugar      REAL    NOT NULL DEFAULT 0,
        carbs_complex    REAL    NOT NULL DEFAULT 0,
        carbs_fiber      REAL    NOT NULL DEFAULT 0,
        protein          REAL    NOT NULL DEFAULT 0,
        fat_total        REAL    NOT NULL DEFAULT 0,
        fat_unsaturated  REAL    NOT NULL DEFAULT 0,
        fat_mono_poly    REAL    NOT NULL DEFAULT 0,
        fat_trans        REAL    NOT NULL DEFAULT 0,
        created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name)`,

      `CREATE TABLE IF NOT EXISTS recipes (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL UNIQUE,
        description TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name)`,

      `CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id     INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
        grams         REAL    NOT NULL,
        UNIQUE(recipe_id, ingredient_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_ri_recipe ON recipe_ingredients(recipe_id)`,
      `CREATE INDEX IF NOT EXISTS idx_ri_ingredient ON recipe_ingredients(ingredient_id)`,

      `CREATE TABLE IF NOT EXISTS daily_goals (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        date            TEXT    NOT NULL UNIQUE,
        kcal_goal       REAL,
        protein_goal    REAL,
        carbs_goal      REAL,
        fat_goal        REAL,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_goals_date ON daily_goals(date)`,

      `CREATE TABLE IF NOT EXISTS meal_entries (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        date          TEXT    NOT NULL,
        meal_type     TEXT    NOT NULL,
        food_type     TEXT    NOT NULL,
        food_id       INTEGER NOT NULL,
        grams         REAL    NOT NULL,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
        CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
        CHECK (food_type IN ('ingredient','recipe')),
        CHECK (grams > 0)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_entries_date ON meal_entries(date)`,
      `CREATE INDEX IF NOT EXISTS idx_entries_date_meal ON meal_entries(date, meal_type)`,
    ],
  },
  {
    version: 2,
    up: [
      `ALTER TABLE daily_goals ADD COLUMN water_goal_ml REAL NOT NULL DEFAULT 2000`,

      `CREATE TABLE IF NOT EXISTS water_entries (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        date       TEXT    NOT NULL,
        amount_ml  REAL    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_water_date ON water_entries(date)`,

      `CREATE TABLE IF NOT EXISTS weight_entries (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        date       TEXT    NOT NULL UNIQUE,
        weight_kg  REAL    NOT NULL,
        note       TEXT,
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_entries(date)`,

      `CREATE TABLE IF NOT EXISTS goal_templates (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        name         TEXT    NOT NULL UNIQUE,
        kcal_goal    REAL,
        protein_goal REAL,
        carbs_goal   REAL,
        fat_goal     REAL,
        water_goal_ml REAL DEFAULT 2000
      )`,
    ],
  },
  {
    version: 3,
    up: [
      `CREATE TABLE IF NOT EXISTS app_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS meal_slots (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        name         TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        emoji        TEXT NOT NULL DEFAULT '🍽️',
        sort_order   INTEGER NOT NULL DEFAULT 0
      )`,
      `INSERT OR IGNORE INTO meal_slots (name, display_name, emoji, sort_order) VALUES
        ('breakfast', 'Breakfast', '🌅', 0),
        ('lunch',     'Lunch',     '☀️', 1),
        ('dinner',    'Dinner',    '🌙', 2),
        ('snack',     'Snack',     '☕', 3)`,
      `CREATE TABLE IF NOT EXISTS meal_entries_v3 (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        date       TEXT NOT NULL,
        meal_type  TEXT NOT NULL,
        food_type  TEXT NOT NULL CHECK (food_type IN ('ingredient','recipe')),
        food_id    INTEGER NOT NULL,
        grams      REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        CHECK (grams > 0)
      )`,
      `INSERT INTO meal_entries_v3 SELECT * FROM meal_entries`,
      `DROP TABLE meal_entries`,
      `ALTER TABLE meal_entries_v3 RENAME TO meal_entries`,
      `CREATE INDEX IF NOT EXISTS idx_entries_date2     ON meal_entries(date)`,
      `CREATE INDEX IF NOT EXISTS idx_entries_date_meal2 ON meal_entries(date, meal_type)`,
    ],
  },
];
