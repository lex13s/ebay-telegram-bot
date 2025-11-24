"use strict";
/**
 * Mock Factory для создания тестовых объектов
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFactory = void 0;
const User_1 = require("../../src/domain/entities/User");
const Coupon_1 = require("../../src/domain/entities/Coupon");
const SearchResult_1 = require("../../src/domain/entities/SearchResult");
const UserId_1 = require("../../src/domain/value-objects/UserId");
const Balance_1 = require("../../src/domain/value-objects/Balance");
const PartNumber_1 = require("../../src/domain/value-objects/PartNumber");
const CouponCode_1 = require("../../src/domain/value-objects/CouponCode");
const SearchConfigKey_1 = require("../../src/domain/value-objects/SearchConfigKey");
class MockFactory {
    /**
     * Создать тестового пользователя
     */
    static createUser(overrides) {
        const defaults = {
            id: 123456,
            username: 'testuser',
            balanceCents: 10000, // $100 in cents
            searchConfig: 'SOLD',
        };
        const data = { ...defaults, ...overrides };
        return User_1.User.create(UserId_1.UserId.create(data.id), data.username, Balance_1.Balance.create(data.balanceCents), SearchConfigKey_1.SearchConfigKey.create(data.searchConfig));
    }
    /**
     * Создать тестовый купон
     */
    static createCoupon(overrides) {
        const defaults = {
            code: 'ABCD-1234-EFGH',
            valueCents: 5000, // $50 in cents
            isActivated: false,
            activatedBy: null,
            activatedAt: null,
        };
        const data = { ...defaults, ...overrides };
        if (data.isActivated && data.activatedBy && data.activatedAt) {
            return Coupon_1.Coupon.createFromDb(CouponCode_1.CouponCode.create(data.code), Balance_1.Balance.create(data.valueCents), data.isActivated, UserId_1.UserId.create(data.activatedBy), data.activatedAt);
        }
        return Coupon_1.Coupon.create(CouponCode_1.CouponCode.create(data.code), Balance_1.Balance.create(data.valueCents));
    }
    /**
  6321   * Создать результат поиска (найденный)
     */
    static createSearchResult(overrides) {
        const defaults = {
            partNumber: 'TEST-123',
            itemId: 'ITEM-12345',
            title: 'Test Item Title',
            priceValue: '99.99',
            priceCurrency: 'USD',
        };
        const data = { ...defaults, ...overrides };
        return SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create(data.partNumber), {
            itemId: data.itemId,
            title: data.title,
            priceValue: data.priceValue,
            priceCurrency: data.priceCurrency,
        });
    }
    /**
     * Создать результат поиска (не найденный)
     */
    static createSearchResultNotFound(partNumber) {
        return SearchResult_1.SearchResult.createNotFound(PartNumber_1.PartNumber.create(partNumber));
    }
    /**
     * Создать массив результатов поиска
     */
    static createSearchResults(count) {
        return Array.from({ length: count }, (_, i) => MockFactory.createSearchResult({
            partNumber: `PART-${i + 1}`,
            itemId: `ITEM-${i + 1}`,
            title: `Item ${i + 1}`,
            priceValue: `${(i + 1) * 10}.00`,
            priceCurrency: 'USD',
        }));
    }
}
exports.MockFactory = MockFactory;
