import { getMainMenuKeyboard, getSearchSettingsKeyboard } from '../src/utils';

describe('utils.ts', () => {
  describe('getMainMenuKeyboard', () => {
    it('should return keyboard for regular user', () => {
      const keyboard = getMainMenuKeyboard(false);
      const buttons = keyboard.inline_keyboard.flat();
      expect(buttons.some(btn => btn.callback_data === 'generate_coupon_prompt')).toBe(false);
    });

    it('should return keyboard with admin button for admin user', () => {
      const keyboard = getMainMenuKeyboard(true);
      const buttons = keyboard.inline_keyboard.flat();
      expect(buttons.some(btn => btn.callback_data === 'generate_coupon_prompt')).toBe(true);
    });
  });

  describe('getSearchSettingsKeyboard', () => {
    it('should mark the current config with a check', () => {
      const keyboard = getSearchSettingsKeyboard('SOLD');
      const soldButton = keyboard.inline_keyboard[0].find(btn => btn.callback_data === 'set_search_config_SOLD');
      expect(soldButton?.text.includes('✅')).toBe(true);
    });

    it('should not mark other configs with a check', () => {
      const keyboard = getSearchSettingsKeyboard('SOLD');
      const activeButton = keyboard.inline_keyboard[0].find(btn => btn.callback_data === 'set_search_config_ACTIVE');
      expect(activeButton?.text.includes('✅')).toBe(false);
    });
  });
});
