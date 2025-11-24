import TelegramBot from 'node-telegram-bot-api';
import { SearchConfigKey } from '../../domain';

/**
 * Factory for creating Telegram inline keyboards
 */
export class KeyboardBuilder {
  /**
   * Create main menu keyboard
   */
  public static createMainMenu(isAdmin: boolean): TelegramBot.InlineKeyboardMarkup {
    const buttons: TelegramBot.InlineKeyboardButton[][] = [
      [{ text: '💰 Check balance', callback_data: 'check_balance' }],
      [{ text: '💳 Top up balance', callback_data: 'topup' }],
      [{ text: '🎁 Use coupon', callback_data: 'redeem_prompt' }],
      [{ text: '⚙️ Search settings', callback_data: 'search_settings' }],
    ];

    if (isAdmin) {
      buttons.push([
        { text: '🎟️ Generate coupon (Admin)', callback_data: 'generate_coupon_prompt' },
      ]);
    }

    return {
      inline_keyboard: buttons,
    };
  }

  /**
   * Create search settings keyboard
   */
  public static createSearchSettings(
    currentConfig: SearchConfigKey
  ): TelegramBot.InlineKeyboardMarkup {
    const configValue = currentConfig.getValue();

    return {
      inline_keyboard: [
        [
          {
            text: configValue === 'ACTIVE' ? '✅ Active listings' : 'Active listings',
            callback_data: 'set_search_config_ACTIVE',
          },
        ],
        [
          {
            text: configValue === 'SOLD' ? '✅ Sold listings' : 'Sold listings',
            callback_data: 'set_search_config_SOLD',
          },
        ],
        [
          {
            text: configValue === 'ENDED' ? '✅ Ended listings' : 'Ended listings',
            callback_data: 'set_search_config_ENDED',
          },
        ],
        [{ text: '🔙 Back to main menu', callback_data: 'back_to_main_menu' }],
      ],
    };
  }

  /**
   * Create insufficient funds keyboard
   */
  public static createInsufficientFunds(): TelegramBot.InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: '💳 Top up balance', callback_data: 'topup' }],
        [{ text: '🎁 Use coupon', callback_data: 'redeem_prompt' }],
      ],
    };
  }

  /**
   * Create force reply keyboard for text input
   */
  public static createForceReply(): any {
    return {
      force_reply: true,
      selective: true,
    };
  }

  /**
   * Create remove keyboard
   */
  public static createRemoveKeyboard(): TelegramBot.ReplyKeyboardRemove {
    return {
      remove_keyboard: true,
    };
  }
}
