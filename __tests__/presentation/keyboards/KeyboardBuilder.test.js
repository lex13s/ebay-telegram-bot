"use strict";
/**
 * Тесты для KeyboardBuilder
 */
Object.defineProperty(exports, "__esModule", { value: true });
const KeyboardBuilder_1 = require("../../../src/presentation/keyboards/KeyboardBuilder");
const SearchConfigKey_1 = require("../../../src/domain/value-objects/SearchConfigKey");
describe('Presentation Layer - Keyboards: KeyboardBuilder', () => {
    describe('createMainMenu', () => {
        it('should create main menu for regular user', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(false);
            expect(keyboard.inline_keyboard).toBeDefined();
            expect(keyboard.inline_keyboard).toHaveLength(4);
            expect(keyboard.inline_keyboard[0][0].text).toBe('💰 Check balance');
            expect(keyboard.inline_keyboard[1][0].text).toBe('💳 Top up balance');
            expect(keyboard.inline_keyboard[2][0].text).toBe('🎁 Use coupon');
            expect(keyboard.inline_keyboard[3][0].text).toBe('⚙️ Search settings');
        });
        it('should create main menu for admin user with extra button', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(true);
            expect(keyboard.inline_keyboard).toHaveLength(5);
            expect(keyboard.inline_keyboard[4][0].text).toBe('🎟️ Generate coupon (Admin)');
            expect(keyboard.inline_keyboard[4][0].callback_data).toBe('generate_coupon_prompt');
        });
        it('should have correct callback_data for all buttons', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(false);
            expect(keyboard.inline_keyboard[0][0].callback_data).toBe('check_balance');
            expect(keyboard.inline_keyboard[1][0].callback_data).toBe('topup');
            expect(keyboard.inline_keyboard[2][0].callback_data).toBe('redeem_prompt');
            expect(keyboard.inline_keyboard[3][0].callback_data).toBe('search_settings');
        });
    });
    describe('createSearchSettings', () => {
        it('should mark ACTIVE config as selected', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createSearchSettings(config);
            expect(keyboard.inline_keyboard).toHaveLength(4);
            expect(keyboard.inline_keyboard[0][0].text).toBe('✅ Active listings');
            expect(keyboard.inline_keyboard[1][0].text).toBe('Sold listings');
            expect(keyboard.inline_keyboard[2][0].text).toBe('Ended listings');
        });
        it('should mark SOLD config as selected', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createSearchSettings(config);
            expect(keyboard.inline_keyboard[0][0].text).toBe('Active listings');
            expect(keyboard.inline_keyboard[1][0].text).toBe('✅ Sold listings');
            expect(keyboard.inline_keyboard[2][0].text).toBe('Ended listings');
        });
        it('should mark ENDED config as selected', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createSearchSettings(config);
            expect(keyboard.inline_keyboard[0][0].text).toBe('Active listings');
            expect(keyboard.inline_keyboard[1][0].text).toBe('Sold listings');
            expect(keyboard.inline_keyboard[2][0].text).toBe('✅ Ended listings');
        });
        it('should have correct callback_data for config buttons', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createSearchSettings(config);
            expect(keyboard.inline_keyboard[0][0].callback_data).toBe('set_search_config_ACTIVE');
            expect(keyboard.inline_keyboard[1][0].callback_data).toBe('set_search_config_SOLD');
            expect(keyboard.inline_keyboard[2][0].callback_data).toBe('set_search_config_ENDED');
        });
        it('should have back button', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createSearchSettings(config);
            expect(keyboard.inline_keyboard[3][0].text).toBe('🔙 Back to main menu');
            expect(keyboard.inline_keyboard[3][0].callback_data).toBe('back_to_main_menu');
        });
    });
    describe('createInsufficientFunds', () => {
        it('should create keyboard with topup and coupon options', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createInsufficientFunds();
            expect(keyboard.inline_keyboard).toHaveLength(2);
            expect(keyboard.inline_keyboard[0][0].text).toBe('💳 Top up balance');
            expect(keyboard.inline_keyboard[0][0].callback_data).toBe('topup');
            expect(keyboard.inline_keyboard[1][0].text).toBe('🎁 Use coupon');
            expect(keyboard.inline_keyboard[1][0].callback_data).toBe('redeem_prompt');
        });
    });
    describe('createForceReply', () => {
        it('should create force reply keyboard', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createForceReply();
            expect(keyboard.force_reply).toBe(true);
            expect(keyboard.selective).toBe(true);
        });
    });
    describe('createRemoveKeyboard', () => {
        it('should create remove keyboard object', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createRemoveKeyboard();
            expect(keyboard.remove_keyboard).toBe(true);
        });
    });
    describe('keyboard structure', () => {
        it('should return InlineKeyboardMarkup type for createMainMenu', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(false);
            expect(keyboard).toHaveProperty('inline_keyboard');
            expect(Array.isArray(keyboard.inline_keyboard)).toBe(true);
        });
        it('should have array of arrays structure', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(false);
            keyboard.inline_keyboard.forEach((row) => {
                expect(Array.isArray(row)).toBe(true);
                row.forEach((button) => {
                    expect(button).toHaveProperty('text');
                    expect(button).toHaveProperty('callback_data');
                });
            });
        });
    });
    describe('button properties', () => {
        it('all buttons should have non-empty text', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(true);
            keyboard.inline_keyboard.forEach((row) => {
                row.forEach((button) => {
                    expect(button.text).toBeTruthy();
                    expect(button.text.length).toBeGreaterThan(0);
                });
            });
        });
        it('all buttons should have non-empty callback_data', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(true);
            keyboard.inline_keyboard.forEach((row) => {
                row.forEach((button) => {
                    expect(button.callback_data).toBeTruthy();
                    expect(typeof button.callback_data).toBe('string');
                });
            });
        });
    });
    describe('admin functionality', () => {
        it('should not show admin button for non-admin', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(false);
            const hasAdminButton = keyboard.inline_keyboard.some((row) => row.some((btn) => btn.text.includes('Admin')));
            expect(hasAdminButton).toBe(false);
        });
        it('should show admin button for admin', () => {
            const keyboard = KeyboardBuilder_1.KeyboardBuilder.createMainMenu(true);
            const hasAdminButton = keyboard.inline_keyboard.some((row) => row.some((btn) => btn.text.includes('Admin')));
            expect(hasAdminButton).toBe(true);
        });
    });
    describe('config selection visualization', () => {
        it('only one config should be marked as selected', () => {
            const configs = ['ACTIVE', 'SOLD', 'ENDED'];
            configs.forEach((configValue) => {
                const config = SearchConfigKey_1.SearchConfigKey.create(configValue);
                const keyboard = KeyboardBuilder_1.KeyboardBuilder.createSearchSettings(config);
                const selectedButtons = keyboard.inline_keyboard
                    .slice(0, 3) // First 3 rows are config buttons
                    .filter((row) => row[0].text.includes('✅'));
                expect(selectedButtons).toHaveLength(1);
            });
        });
    });
});
