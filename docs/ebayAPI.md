# eBay API Integration (Buy APIs)

Обновлено: 2025-11-01

Цель: единая реализация поиска активных и проданных/завершённых товаров без Finding API (Finding деактивирован).

Ссылки:
- Deprecation status: https://developer.ebay.com/develop/get-started/api-deprecation-status
- Browse API overview: https://developer.ebay.com/api-docs/buy/browse/static/overview.html
- Marketplace Insights API: https://developer.ebay.com/api-docs/buy/marketplace-insights/overview.html

## Архитектура

- ACTIVE → Browse API: GET /buy/browse/v1/item_summary/search
  - Параметры: q, limit, filter (например, `buyingOptions:{FIXED_PRICE}`), sort (опционально)
  - Заголовки: Authorization: Bearer <token>
- SOLD/ENDED → Marketplace Insights API: GET /buy/marketplace_insights/v1_beta/item_sales/search
  - Параметры: q, limit, sort (например, `date_sold:desc`), фильтры по времени при необходимости
  - Заголовки: Authorization: Bearer <token>, X-EBAY-C-MARKETPLACE-ID: <marketplaceId>

Единая точка входа: `searchItemsByKeyword(keywords: string[], mode: 'ACTIVE' | 'SOLD' | 'ENDED')`.

## OAuth и токены

- Для Browse используем app token со скоупами по умолчанию.
- Для Insights требуется scope: `https://api.ebay.com/oauth/api_scope/buy.marketplace.insights`.
- Токены кэшируются в `appTokenCache` по ключам `browse` и `insights` с учётом `expires_in` и `TOKEN_EXPIRATION_BUFFER`.
- В режиме ACTIVE токен запрашивается один раз на батч и один раз устанавливается в `ebayApi.OAuth2.setCredentials`.

## Marketplace ID

- Конфиг по умолчанию: `DEFAULT_MARKETPLACE_ID` (например, `EBAY_US`).
- Эвристика для автозапчастей: если keyword похож на партномер вида `AAA-111-BB` → `EBAY_MOTORS_US` (если не задан другой marketplace явно).
- Логика выбора:
  - Если задан не-US marketplace (например, `EBAY_GB`) → используем его без переопределения.
  - Если marketplace отсутствует или `EBAY_US` → для автопартов `EBAY_MOTORS_US`, иначе `EBAY_US`.

## Конфигурация (`ebaySearchConfig.ts`)

- ACTIVE (Browse):
  - filter: `buyingOptions:{FIXED_PRICE}`
  - sort: опционально
- SOLD / ENDED (Insights):
  - marketplaceId: из `DEFAULT_MARKETPLACE_ID` или эвристики
  - periodDays: число дней для анализа (SOLD = 90, ENDED = 30 по умолчанию)
  - sort: `date_sold:desc`

Примечание: Buy APIs не отдают список «unsold» публично. Поэтому ENDED трактуется как «проданные в период» (аналогично SOLD, но можно варьировать период и сортировку).

## Обработка ошибок и лимитов

- Rate limit (429) в Insights → выбрасываем `EBAY_RATE_LIMIT`, чтобы наверх (бот) не списывал средства и показывал корректное сообщение.
- Любые другие не-ОК ответы → логируем предупреждение и возвращаем пустой результат для ключевого слова.
- Browse ошибки → логируем и возвращаем пустой массив для конкретного ключевого слова.

## Маппинг результата

- Browse: itemSummaries → `{ itemId, title, price: { value, currency } }`.
- Insights: itemSales/sales → используем `lastSoldPrice` (или `price/soldPrice`) и `listingId/itemId/transactionId`.

## Тестирование

- Юнит-тесты покрывают:
  - ACTIVE: один setCredentials на батч, параллельные запросы, обработку ошибок.
  - SOLD/ENDED: вызов Insights (fetch), корректные заголовки, маппинг, rate limit (429), non-OK ответы.
  - Выбор marketplaceId по эвристике и `DEFAULT_MARKETPLACE_ID`.

## Быстрый старт

Переменные окружения:
- `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` — креды приложения.
- `DEFAULT_MARKETPLACE_ID` — по умолчанию `EBAY_US`.
- `TOKEN_EXPIRATION_BUFFER` — буфер истечения токена (мс), опционально.

Команды:
```bash
npm run build
npm start
npm test
```

## Известные ограничения

- Marketplace Insights требует соответствующего доступа в eBay Dev Program.
- Доступ к «unsold completed listings» через Buy APIs ограничен — ENDED работает как продажи за период.

## История изменений (кратко)

- Перевод SOLD/ENDED на Marketplace Insights вместо Finding API (Finding снят с поддержки).
- Оптимизация токенов (setCredentials один раз на батч для ACTIVE).
- Унификация маппинга и улучшение логирования.

