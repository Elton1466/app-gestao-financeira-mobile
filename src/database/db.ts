import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'gestao_financeira.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Abre ou retorna a instância singleton do banco de dados SQLite local.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await createTables(db);
      dbInstance = db;
      return db;
    } catch (error) {
      initPromise = null;
      console.error('[Database] Falha ao abrir ou inicializar o SQLite:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Cria as 5 tabelas relacionais do aplicativo e seus respectivos índices.
 */
async function createTables(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        birthDate TEXT,
        phone TEXT,
        avatarUri TEXT,
        monthlyGlobalLimit REAL NOT NULL DEFAULT 5000.0,
        twoFactorEnabled INTEGER NOT NULL DEFAULT 0,
        hideBalance INTEGER NOT NULL DEFAULT 0,
        hasCompletedOnboarding INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
        categoryId TEXT NOT NULL,
        date TEXT NOT NULL,
        isRecurring INTEGER NOT NULL DEFAULT 0,
        isFrequent INTEGER NOT NULL DEFAULT 0,
        installments INTEGER,
        isDemoData INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS financial_goals (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0.0,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        deadline TEXT,
        isDemoData INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS category_budgets (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        monthYear TEXT NOT NULL,
        limitAmount REAL NOT NULL,
        isDemoData INTEGER NOT NULL DEFAULT 0,
        UNIQUE(userId, categoryId, monthYear),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('feedback', 'bug', 'suggestion', 'support_chat')),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('enviado', 'respondido')),
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_date
        ON transactions(userId, date DESC);

      CREATE INDEX IF NOT EXISTS idx_transactions_user_category
        ON transactions(userId, categoryId);

      CREATE INDEX IF NOT EXISTS idx_goals_user
        ON financial_goals(userId);

      CREATE INDEX IF NOT EXISTS idx_budgets_user_month
        ON category_budgets(userId, monthYear);

      CREATE INDEX IF NOT EXISTS idx_tickets_user
        ON support_tickets(userId, createdAt DESC);
    `);

    // Migrações seguras de colunas adicionais para bases existentes
    try {
      await db.execAsync('ALTER TABLE users ADD COLUMN birthDate TEXT;');
    } catch {
      // Coluna já existe
    }
    try {
      await db.execAsync('ALTER TABLE users ADD COLUMN phone TEXT;');
    } catch {
      // Coluna já existe
    }
  } catch (error) {
    console.error('[Database] Erro ao criar tabelas no SQLite:', error);
    throw error;
  }
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  return getDatabase();
}

export const initDatabase = initializeDatabase;

