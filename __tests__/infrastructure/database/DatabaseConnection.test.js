"use strict";
/**
 * Tests for DatabaseConnection
 */
Object.defineProperty(exports, "__esModule", { value: true });
const DatabaseConnection_1 = require("../../../src/infrastructure/database/DatabaseConnection");
describe('Infrastructure Layer - Database: DatabaseConnection', () => {
    let connection;
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        connection = new DatabaseConnection_1.DatabaseConnection(':memory:', mockLogger);
    });
    afterEach(async () => {
        try {
            await connection.close();
        }
        catch {
            // Ignore if already closed
        }
    });
    describe('connect', () => {
        it('should connect to in-memory database', async () => {
            await connection.connect();
            expect(mockLogger.info).toHaveBeenCalledWith('Connected to SQLite database', {
                dbName: ':memory:',
            });
        });
        it('should throw on invalid database path', async () => {
            const badConnection = new DatabaseConnection_1.DatabaseConnection('/invalid/path/db.sqlite', mockLogger);
            await expect(badConnection.connect()).rejects.toThrow();
        });
    });
    describe('initialize', () => {
        it('should create users and coupons tables', async () => {
            await connection.connect();
            await connection.initialize();
            expect(mockLogger.info).toHaveBeenCalledWith('Database tables initialized');
        });
        it('should throw if not connected', async () => {
            await expect(connection.initialize()).rejects.toThrow('Database not connected');
        });
    });
    describe('getDb', () => {
        it('should return database instance', async () => {
            await connection.connect();
            const db = connection.getDb();
            expect(db).toBeDefined();
        });
        it('should throw if not connected', () => {
            expect(() => connection.getDb()).toThrow('Database not connected');
        });
    });
    describe('close', () => {
        it('should close database connection', async () => {
            await connection.connect();
            await connection.close();
            expect(mockLogger.info).toHaveBeenCalledWith('Database connection closed');
        });
        it('should not throw if already closed', async () => {
            await expect(connection.close()).resolves.not.toThrow();
        });
    });
});
