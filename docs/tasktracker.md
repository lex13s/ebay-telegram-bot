## Task: Refactor and Fix eBay Search
- **Status**: Completed
- **Description**: Completely redesigned and fixed the logic for interacting with the eBay API, added new functionality, and ensured stable operation.
- **Execution Steps**:
  - [x] Implement the ability for users to choose the search type (`ACTIVE`, `SOLD`, `ENDED`).
  - [x] Separate the call logic into `Browse API` (for `ACTIVE`) and `Finding API` (for `SOLD`/`ENDED`).
  - [x] Fix the authentication mechanism for each API type, eliminating `invalid_client` and `RateLimiter` errors.
  - [x] Introduce sequential request processing with a delay to comply with API limits.
  - [x] Create a single mapper to unify the data structure from different APIs.
  - [x] Eliminate all TypeScript compilation errors and potential runtime errors.
  - [x] Add unit tests to check the main logic of interaction with the API.
- **Dependencies**: None

## Task: Audit and Improve Error Handling in Asynchronous Functions
- **Status**: Completed
- **Description**: Review all asynchronous functions for error handling using `try-catch-finally` blocks and improve error logging/handling to increase application stability.
- **Execution Steps**:
  - [x] Document the task.
  - [x] Audit `src/ebayApi.ts`.
  - [x] Audit `src/ebay.ts`.
  - [x] Audit `src/bot.ts`.
  - [x] Implement/improve `try-catch-finally` and error logging.
- **Dependencies**: None

## Task: Fix Tests After Refactoring
- **Status**: Completed
- **Description**: Adapt existing tests to changes made in the main code (changes in function signatures, parallel processing logic, improved error handling).
- **Execution Steps**:
  - [x] Identify affected test files.
  - [x] Analyze changes in test files.
  - [x] Make corrections to test files: `__tests__/ebayApi.test.ts`.
  - [x] Make corrections to test files: `__tests__/ebay.test.ts`.
  - [x] Make corrections to test files: `__tests__/bot.test.ts`.
  - [x] Make corrections to test files: `__tests__/ebay.ispec.ts`.
  - [x] Make corrections to test files: `__tests__/excel.test.ts`.
  - [x] Make corrections to test files: `__tests__/test-api.ts`.
  - [x] Audit `__tests__/utils.test.ts` (no changes required).
- **Dependencies**: None
