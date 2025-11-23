# eBay API Integration (Buy APIs)

Updated: 2025-11-01

Goal: a unified implementation for searching active and sold/ended items without the Finding API (Finding is deprecated).

Links:
- Deprecation status: https://developer.ebay.com/develop/get-started/api-deprecation-status
- Browse API overview: https://developer.ebay.com/api-docs/buy/browse/static/overview.html
- Marketplace Insights API: https://developer.ebay.com/api-docs/buy/marketplace-insights/overview.html

## Architecture

- ACTIVE → Browse API: GET /buy/browse/v1/item_summary/search
  - Parameters: q, limit, filter (e.g., `buyingOptions:{FIXED_PRICE}`), sort (optional)
  - Headers: Authorization: Bearer <token>
- SOLD/ENDED → Marketplace Insights API: GET /buy/marketplace_insights/v1_beta/item_sales/search
  - Parameters: q, limit, sort (e.g., `date_sold:desc`), time filters if necessary
  - Headers: Authorization: Bearer <token>, X-EBAY-C-MARKETPLACE-ID: <marketplaceId>

Single entry point: `searchItemsByKeyword(keywords: string[], mode: 'ACTIVE' | 'SOLD' | 'ENDED')`.

## OAuth and Tokens

- For Browse, we use an app token with default scopes.
- For Insights, the scope `https://api.ebay.com/oauth/api_scope/buy.marketplace.insights` is required.
- Tokens are cached in `appTokenCache` under the keys `browse` and `insights`, considering `expires_in` and `TOKEN_EXPIRATION_BUFFER`.
- In ACTIVE mode, the token is requested once per batch and set once in `ebayApi.OAuth2.setCredentials`.

## Marketplace ID

- Default config: `DEFAULT_MARKETPLACE_ID` (e.g., `EBAY_US`).
- Heuristics for auto parts: if the keyword looks like a part number of the form `AAA-111-BB` → `EBAY_MOTORS_US` (unless another marketplace is explicitly set).
- Selection logic:
  - If a non-US marketplace is set (e.g., `EBAY_GB`) → use it without overriding.
  - If the marketplace is missing or `EBAY_US` → for auto parts, `EBAY_MOTORS_US`, otherwise `EBAY_US`.

## Configuration (`ebaySearchConfig.ts`)

- ACTIVE (Browse):
  - filter: `buyingOptions:{FIXED_PRICE}`
  - sort: optional
- SOLD / ENDED (Insights):
  - marketplaceId: from `DEFAULT_MARKETPLACE_ID` or heuristics
  - periodDays: number of days for analysis (SOLD = 90, ENDED = 30 by default)
  - sort: `date_sold:desc`

Note: Buy APIs do not publicly provide a list of "unsold" items. Therefore, ENDED is treated as "sold within a period" (similar to SOLD, but the period and sorting can be varied).

## Error and Limit Handling

- Rate limit (429) in Insights → throw `EBAY_RATE_LIMIT` so that the higher level (the bot) does not deduct funds and shows the correct message.
- Any other non-OK responses → log a warning and return an empty result for the keyword.
- Browse errors → log and return an empty array for the specific keyword.

## Result Mapping

- Browse: itemSummaries → `{ itemId, title, price: { value, currency } }`.
- Insights: itemSales/sales → use `lastSoldPrice` (or `price/soldPrice`) and `listingId/itemId/transactionId`.

## Testing

- Unit tests cover:
  - ACTIVE: one setCredentials per batch, parallel requests, error handling.
  - SOLD/ENDED: Insights call (fetch), correct headers, mapping, rate limit (429), non-OK responses.
  - Selection of marketplaceId by heuristics and `DEFAULT_MARKETPLACE_ID`.

## Quick Start

Environment variables:
- `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` — application credentials.
- `DEFAULT_MARKETPLACE_ID` — defaults to `EBAY_US`.
- `TOKEN_EXPIRATION_BUFFER` — token expiration buffer (ms), optional.

Commands:
```bash
npm run build
npm start
npm test
```

## Known Limitations

- Marketplace Insights requires corresponding access in the eBay Dev Program.
- Access to "unsold completed listings" via Buy APIs is limited — ENDED works as sales over a period.

## Change History (brief)

- Migration of SOLD/ENDED to Marketplace Insights instead of the Finding API (Finding is deprecated).
- Token optimization (setCredentials once per batch for ACTIVE).
- Unification of mapping and improvement of logging.
