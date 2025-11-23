import sqlite3 from 'sqlite3';
import { ILogger } from '../logging/Logger';

/**
 * Database connection manager
 */
export class DatabaseConnection {
  private db: sqlite3.Database | null = null;

  constructor(
    private readonly dbName: string,
    private readonly logger: ILogger
  ) {}

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbName, (err) => {
        if (err) {
          this.logger.error('Failed to connect to database', err);
          return reject(err);
        }
        this.logger.info('Connected to SQLite database', { dbName: this.dbName });
        resolve();
      });
    });
  }

  public async initialize(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        // Users table
        this.db!.run(
          `CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            balance_cents INTEGER NOT NULL DEFAULT 0,
            search_config_key TEXT NOT NULL DEFAULT 'SOLD'
          )`,
          (err) => {
            if (err) {
              this.logger.error('Failed to create users table', err);
              return reject(err);
            }
          }
        );

        // Coupons table
        this.db!.run(
          `CREATE TABLE IF NOT EXISTS coupons (
            code TEXT PRIMARY KEY,
            value_cents INTEGER NOT NULL,
            is_activated BOOLEAN NOT NULL DEFAULT 0,
            activated_by_user_id INTEGER,
            activated_at DATETIME,
            FOREIGN KEY (activated_by_user_id) REFERENCES users(user_id)
          )`,
          (err) => {
            if (err) {
              this.logger.error('Failed to create coupons table', err);
              return reject(err);
            }
            this.logger.info('Database tables initialized');
            resolve();
          }
        );
      });
    });
  }

  public getDb(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          this.logger.error('Failed to close database', err);
          return reject(err);
        }
        this.logger.info('Database connection closed');
        this.db = null;
        resolve();
      });
    });
  }

  public run(query: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDb().run(query, params, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  public get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.getDb().get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row as T);
      });
    });
  }

  public all<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.getDb().all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows as T[]);
      });
    });
  }
}

