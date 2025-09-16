import sqlite3 from 'sqlite3';
import { config } from './config';

export interface User {
    user_id: number;
    username: string | null;
    balance_cents: number;
}

export interface Coupon {
    code: string;
    value_cents: number;
    is_activated: boolean;
    activated_by_user_id: number | null;
    activated_at: string | null;
}

let db: sqlite3.Database;

export function initDb(): Promise<void> {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(config.dbName, (err) => {
            if (err) {
                return reject(err);
            }
            console.log('Подключено к базе данных SQLite.');

            db.serialize(() => {
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        user_id INTEGER PRIMARY KEY,
                        username TEXT,
                        balance_cents INTEGER NOT NULL DEFAULT 0
                    );
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS coupons (
                        code TEXT PRIMARY KEY,
                        value_cents INTEGER NOT NULL,
                        is_activated BOOLEAN NOT NULL DEFAULT 0,
                        activated_by_user_id INTEGER,
                        activated_at DATETIME,
                        FOREIGN KEY (activated_by_user_id) REFERENCES users(user_id)
                    );
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    });
}

const dbGet = <T>(query: string, params: any[] = []): Promise<T | undefined> => 
    new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => err ? reject(err) : resolve(row as T));
    });

const dbRun = (query: string, params: any[] = []): Promise<void> =>
    new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            err ? reject(err) : resolve();
        });
    });

export async function getOrCreateUser(userId: number, username?: string): Promise<User> {
    let user = await dbGet<User>('SELECT * FROM users WHERE user_id = ?', [userId]);

    if (!user) {
        await dbRun(
            'INSERT INTO users (user_id, username, balance_cents) VALUES (?, ?, ?)',
            [userId, username || null, config.trialBalanceCents]
        );
        user = await dbGet<User>('SELECT * FROM users WHERE user_id = ?', [userId]);
    }
    return user!;
}

export async function getUser(userId: number): Promise<User | undefined> {
    return dbGet<User>('SELECT * FROM users WHERE user_id = ?', [userId]);
}

export async function updateUserBalance(userId: number, newBalance: number): Promise<void> {
    return dbRun('UPDATE users SET balance_cents = ? WHERE user_id = ?', [newBalance, userId]);
}

export async function createCoupon(code: string, valueCents: number): Promise<void> {
    // Explicitly set is_activated to 0 to prevent NOT NULL constraint errors.
    return dbRun('INSERT INTO coupons (code, value_cents, is_activated) VALUES (?, ?, 0)', [code, valueCents]);
}

export async function getCoupon(code: string): Promise<Coupon | undefined> {
    return dbGet<Coupon>('SELECT * FROM coupons WHERE code = ?', [code]);
}

export async function activateCoupon(code: string, userId: number): Promise<void> {
    return dbRun(
        'UPDATE coupons SET is_activated = 1, activated_by_user_id = ?, activated_at = CURRENT_TIMESTAMP WHERE code = ?',
        [userId, code]
    );
}
