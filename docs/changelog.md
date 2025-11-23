## [2024-07-26] - Refactoring and Fixing eBay Search

### Added
- **Search Type Selection:** Implemented the ability for users to choose the search type: `ACTIVE`, `SOLD`, and `ENDED`.
- **API Tests:** Added a set of unit tests for `ebayApi.ts` using Jest to verify the correctness of various API method calls.

### Changed
- **API Logic Separation:** The logic for interacting with the eBay API in `ebayApi.ts` was separated:
    - `Browse API` (`buy.browse.search`) is now used only for searching `ACTIVE` items.
    - `Finding API` (`finding.findCompletedItems`) is used for searching `SOLD` and `ENDED` items.
- **Authentication Mechanism:** The authentication mechanism was completely reworked to meet the requirements of each API:
    - For `Browse API`, an OAuth 2.0 token is obtained.
    - For `Finding API`, only the `appId` (Client ID) is used, passed manually in the request parameters, which resolves all previous `invalid_client` and `RateLimiter` errors.
- **Request Handling:** Multiple requests are now executed sequentially with a 1-second delay to comply with the strict limits of the `Finding API`.
- **Data Unification:** A single mapper function `mapToEbayItem` was created to standardize the responses from both APIs into a unified structure, ensuring the stability of subsequent data processing.

### Fixed
- **Code Reliability:** Numerous TypeScript compilation errors, typos, and potential runtime errors (e.g., calling `.toString()` on `undefined`) were eliminated.
- **Bot Stability:** Improved error handling in `bot.ts` to prevent application crashes.

## [2024-07-30] - Checking TOKEN_EXPIRATION_BUFFER
### Changed
- Started checking the value of `TOKEN_EXPIRATION_BUFFER` for further optimization.

## [2024-07-30] - Completion of TOKEN_EXPIRATION_BUFFER Check
### Changed
- Completed the check of the `TOKEN_EXPIRATION_BUFFER` value. It was determined that the current value (5 minutes) is optimal and is not a cause of slowdown.

## [2024-07-30] - Adding eBay API Response Time Logging
### Added
- Added logging of the execution time of requests to the eBay Browse API and eBay Finding API for performance analysis.

## [2024-07-30] - Implementing Promise.all for Parallel Processing of partNumbers
### Changed
- The `searchItemsByKeyword` function was changed to accept an array of keywords and use `Promise.all` for parallel execution of requests to the eBay API.

## [2024-07-30] - Fixing Compilation Errors After Implementing Promise.all
### Fixed
- Fixed compilation errors in `src/ebay.ts` related to the change in the signature and return type of the `searchItemsByKeyword` function.

## [2024-07-30] - Restructuring the findItem Function for Parallel Processing
### Changed
- The signature of the `findItem` function in `src/ebay.ts` was changed to accept an array of `partNumbers` and return an array of results, allowing `Promise.all` to be used in `searchItemsByKeyword` for parallel execution of requests.
- The internal logic of `findItem` was updated to handle the results from `searchItemsByKeyword` for each `partNumber`.

## [2024-07-30] - Fixing Compilation Errors in src/bot.ts
### Fixed
- Fixed compilation errors in `src/bot.ts` related to the change in the signature and return type of the `findItem` function.

## [2024-07-30] - Completion of Performance Analysis
### Fixed
- Identified and eliminated the main cause of slow performance: sequential execution of requests with an artificial delay `delay(1000)` in `src/bot.ts`. Removing the delay and implementing parallel processing of requests via `Promise.all` significantly improved performance.

## [2024-07-30] - Audit and Improvement of Error Handling in src/ebayApi.ts
### Changed
- Added and improved error handling using `try-catch` blocks in the asynchronous functions `getEbayAppToken`, `searchActiveItems`, `searchCompletedItems`, and `searchItemsByKeyword` in `src/ebayApi.ts` to increase stability. In case of network request errors, the search functions now return empty arrays.

## [2024-07-30] - Audit of Error Handling in src/ebay.ts
### Changed
- Conducted an audit of error handling in `src/ebay.ts`. The existing implementation with `try-catch` in the `findItem` function was deemed adequate for current requirements, as it logs errors and propagates them for further handling at a higher level.

## [2024-07-30] - Audit and Improvement of Error Handling in src/bot.ts
### Changed
- Conducted an audit of error handling in `src/bot.ts`. Added `try-catch` blocks using `handleApiError` in the `case` operators `check_balance`, `topup`, `redeem_prompt`, and `generate_coupon_prompt` inside `bot.on('callback_query')` to increase stability.

## [2024-07-30] - Fixing Tests After Refactoring
### Fixed
- Fixed tests in `__tests__/ebayApi.test.ts` to align with new function signatures, return types, and parallel processing logic.
- Fixed tests in `__tests__/ebay.test.ts` to align with new function signatures, return types, and parallel processing logic.
- Fixed tests in `__tests__/bot.test.ts` to align with new function signatures, return types, and parallel processing logic.
- Fixed tests in `__tests__/ebay.ispec.ts` to align with new function signatures, return types, and parallel processing logic.
- Fixed tests in `__tests__/excel.test.ts` to align with new function signatures, return types, and parallel processing logic.
- Fixed tests in `__tests__/test-api.ts` to align with new function signatures, return types, and parallel processing logic.
- Audit of `__tests__/utils.test.ts` showed that no changes were required.

## [2024-07-30] - Debugging Tests After Refactoring
### Changed
- Discovered errors in tests after previous fixes. Further debugging and correction of test files are required.
- Fixed a `ReferenceError` in `__tests__/ebayApi.test.ts` caused by the order of Jest mocks.
- Fixed an incorrect mock of `getEbayAppToken` in `__tests__/ebayApi.test.ts` by directly mocking `ebay-oauth-nodejs-client`.
- Fixed an issue with the order of mocks and module loading in `__tests__/ebayApi.test.ts` using `jest.doMock` and `require` for the module under test.
- Fixed a `TypeError` in `__tests__/ebayApi.test.ts` by correctly mocking the `EbayAuthToken` constructor.
- Revised the mocking strategy in `__tests__/ebayApi.test.ts` to finally fix `ReferenceError` and `TypeError` using `jest.resetModules()`.
- Fixed a `TypeError` in `__tests__/ebayApi.test.ts` by correctly mocking the `EbayAuthToken` constructor and using `jest.resetModules()`.
- Fixed an `expect(jest.fn()).toHaveBeenCalledTimes(expected)` error in `__tests__/ebayApi.test.ts` by using `jest.resetModules()` to ensure correct mock loading.
- Fixed an `expect(jest.fn()).toHaveBeenCalledTimes(expected)` error in `__tests__/ebayApi.test.ts` by using `jest.resetModules()` to ensure correct mock loading.
- Fixed a race condition in `getEbayAppToken` by caching the token request promise.
- Fixed a race condition for `setCredentials` by moving it inside `getEbayAppToken`.
- All tests in `__tests__/ebayApi.test.ts` now pass successfully.
