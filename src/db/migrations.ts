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
];
