/**
 * Mock Factory для создания тестовых объектов
 */

import { User } from '../../src/domain/entities/User';
import { Coupon } from '../../src/domain/entities/Coupon';
import { SearchResult } from '../../src/domain/entities/SearchResult';
import { UserId } from '../../src/domain/value-objects/UserId';
import { Balance } from '../../src/domain/value-objects/Balance';
import { PartNumber } from '../../src/domain/value-objects/PartNumber';
import { CouponCode } from '../../src/domain/value-objects/CouponCode';
import { SearchConfigKey } from '../../src/domain/value-objects/SearchConfigKey';

export class MockFactory {
  /**
   * Create a test user
   */
  static createUser(
    overrides?: Partial<{
      id: number;
      username: string | null;
      balanceCents: number;
      searchConfig: string;
    }>
  ): User {
    const defaults = {
      id: 123456,
      username: 'testuser',
      balanceCents: 10000, // $100 in cents
      searchConfig: 'SOLD',
    };

    const data = { ...defaults, ...overrides };

    return User.create(
      UserId.create(data.id),
      data.username,
      Balance.create(data.balanceCents),
      SearchConfigKey.create(data.searchConfig)
    );
  }

  /**
   * Создать тестовый купон
   */
  static createCoupon(
    overrides?: Partial<{
      code: string;
      valueCents: number;
      isActivated: boolean;
      activatedBy: number | null;
      activatedAt: Date | null;
    }>
  ): Coupon {
    const defaults = {
      code: 'ABCD-1234-EFGH',
      valueCents: 5000, // $50 in cents
      isActivated: false,
      activatedBy: null,
      activatedAt: null,
    };

    const data = { ...defaults, ...overrides };

    if (data.isActivated && data.activatedBy && data.activatedAt) {
      return Coupon.createFromDb(
        CouponCode.create(data.code),
        Balance.create(data.valueCents),
        data.isActivated,
        UserId.create(data.activatedBy),
        data.activatedAt
      );
    }

    return Coupon.create(CouponCode.create(data.code), Balance.create(data.valueCents));
  }

  /**
6321   * Создать результат поиска (найденный)
   */
  static createSearchResult(
    overrides?: Partial<{
      partNumber: string;
      itemId: string;
      title: string;
      priceValue: string;
      priceCurrency: string;
    }>
  ): SearchResult {
    const defaults = {
      partNumber: 'TEST-123',
      itemId: 'ITEM-12345',
      title: 'Test Item Title',
      priceValue: '99.99',
      priceCurrency: 'USD',
    };

    const data = { ...defaults, ...overrides };

    return SearchResult.createFound(PartNumber.create(data.partNumber), {
      itemId: data.itemId,
      title: data.title,
      priceValue: data.priceValue,
      priceCurrency: data.priceCurrency,
    });
  }

  /**
   * Создать результат поиска (не найденный)
   */
  static createSearchResultNotFound(partNumber: string): SearchResult {
    return SearchResult.createNotFound(PartNumber.create(partNumber));
  }

  /**
   * Создать массив результатов поиска
   */
  static createSearchResults(count: number): SearchResult[] {
    return Array.from({ length: count }, (_, i) =>
      MockFactory.createSearchResult({
        partNumber: `PART-${i + 1}`,
        itemId: `ITEM-${i + 1}`,
        title: `Item ${i + 1}`,
        priceValue: `${(i + 1) * 10}.00`,
        priceCurrency: 'USD',
      })
    );
  }
}
