# Clean Architecture - eBay Bot

## 🏗️ Overall Architecture Structure

The project has been completely refactored applying Clean Architecture principles. The code is separated into 4 main layers, each with a clearly defined responsibility.

```
┌──────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                   │
│         (Handlers, Keyboards, Messages)               │
│  - StartCommandHandler                                │
│  - MessageHandler                                     │
│  - CallbackQueryHandler                               │
│  - PaymentHandler                                     │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                     │
│              (Use Cases, Services)                    │
│  - ProcessSearchUseCase                               │
│  - RedeemCouponUseCase                                │
│  - GenerateCouponUseCase                              │
│  - UserService, CouponService, EbaySearchService      │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│                  DOMAIN LAYER                         │
│      (Entities, Value Objects, Interfaces)            │
│  - User, Coupon, SearchResult                         │
│  - UserId, Balance, PartNumber, CouponCode            │
│  - IUserRepository, ICouponRepository                 │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│               INFRASTRUCTURE LAYER                    │
│    (Database, APIs, Logging, Configuration)           │
│  - SqliteUserRepository, SqliteCouponRepository       │
│  - EbayBrowseApiClient, EbayFindingApiClient          │
│  - Winston Logger, Zod Config Validation              │
│  - TelegramBotAdapter, ExcelReportGenerator           │
└──────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── domain/                          # Domain Layer (Business Logic)
│   ├── entities/                    # Entities with business rules
│   │   ├── User.ts                  # User (balance, settings)
│   │   ├── Coupon.ts                # Coupon (activation, validation)
│   │   └── SearchResult.ts          # Search Result
│   ├── value-objects/               # Immutable Value Objects
│   │   ├── UserId.ts                # User ID
│   │   ├── Balance.ts               # Balance (in cents)
│   │   ├── PartNumber.ts            # Part Number
│   │   ├── CouponCode.ts            # Coupon Code
│   │   └── SearchConfigKey.ts       # Search Type (ACTIVE/SOLD/ENDED)
│   ├── repositories/                # Repository Interfaces
│   │   ├── IUserRepository.ts       # Contract for working with User
│   │   └── ICouponRepository.ts     # Contract for working with Coupon
│   └── errors/                      # Domain Errors
│       └── DomainErrors.ts          # InsufficientFundsError, InvalidCouponError...
│
├── application/                     # Application Layer (Use Cases)
│   ├── use-cases/                   # Business Scenarios
│   │   ├── ProcessSearchUseCase.ts  # Processing part search
│   │   ├── RedeemCouponUseCase.ts   # Coupon activation
│   │   ├── GenerateCouponUseCase.ts # Coupon generation (admin)
│   │   └── UpdateSearchSettingsUseCase.ts # Changing search settings
│   └── services/                    # Services (Orchestration)
│       ├── UserService.ts           # Working with users
│       ├── CouponService.ts         # Working with coupons
│       └── EbaySearchService.ts     # eBay search
│
├── infrastructure/                  # Infrastructure Layer
│   ├── config/                      # Configuration
│   │   ├── EnvConfig.ts             # .env validation via Zod
│   │   ├── AppConfig.ts             # Application config
│   │   ├── TelegramConfig.ts        # Telegram config
│   │   ├── EbayConfig.ts            # eBay API config
│   │   └── PaymentConfig.ts         # Payment config
│   ├── logging/                     # Logging
│   │   └── Logger.ts                # Winston logger with transports
│   ├── database/                    # Database
│   │   ├── DatabaseConnection.ts    # SQLite connection
│   │   ├── SqliteUserRepository.ts  # IUserRepository implementation
│   │   └── SqliteCouponRepository.ts # ICouponRepository implementation
│   ├── ebay/                        # eBay API Clients
│   │   ├── EbayBrowseApiClient.ts   # Browse API (active)
│   │   ├── EbayFindingApiClient.ts  # Finding API (sold/ended)
│   │   └── EbaySearchConfigFactory.ts # Config factory
│   ├── telegram/                    # Telegram Bot API
│   │   └── TelegramBotAdapter.ts    # Adapter for Telegram Bot
│   └── excel/                       # Report Generation
│       └── ExcelReportGenerator.ts  # Excel files with results
│
├── presentation/                    # Presentation Layer
│   ├── handlers/                    # Event Handlers
│   │   ├── StartCommandHandler.ts   # /start command
│   │   ├── MessageHandler.ts        # Text messages
│   │   ├── CallbackQueryHandler.ts  # Inline buttons
│   │   └── PaymentHandler.ts        # Payments
│   ├── keyboards/                   # Keyboards
│   │   └── KeyboardBuilder.ts       # Keyboard factory
│   └── messages/                    # Messages
│       └── MessageTemplates.ts      # Text templates
│
├── shared/                          # Shared utilities
│   ├── constants/                   # Constants
│   ├── types/                       # Common types
│   └── utils/                       # Helper functions
│
└── index.ts                         # Entry point with DI composition
```

## 🔄 Data Flow

### Example: Part Search

```
1. User sends a message with part numbers
   ↓
2. MessageHandler receives the event
   ↓
3. MessageHandler calls ProcessSearchUseCase
   ↓
4. ProcessSearchUseCase:
   - Gets/creates a User via UserService
   - Checks the balance
   - Deducts funds
   - Calls EbaySearchService to search
   ↓
5. EbaySearchService:
   - Determines the search type (Browse/Finding API)
   - Performs the search using the appropriate client
   - Returns SearchResult[]
   ↓
6. ProcessSearchUseCase:
   - If no results → refunds the money
   - If there are results → continues
   ↓
7. MessageHandler:
   - Generates an Excel file via ExcelReportGenerator
   - Sends the file to the user
   - Shows the main menu
```

## 🎯 Key Principles

### 1. Dependency Inversion Principle (DIP)
- The Domain layer does not depend on Infrastructure
- All dependencies are directed inwards (towards the Domain)
- Interfaces are defined in the Domain, implementation in Infrastructure

### 2. Single Responsibility Principle (SRP)
- Each class has a single responsibility
- Use Cases encapsulate a single business scenario
- Handlers only receive events and delegate to Use Cases

### 3. Open/Closed Principle (OCP)
- Easy to add a new Use Case without changing existing ones
- New handlers are added without modifying others
- Extensibility through interfaces

## 🧪 Testability

### Unit tests for Use Cases
```typescript
// Example: ProcessSearchUseCase.test.ts
const mockUserService = {
  getOrCreateUser: jest.fn(),
  saveUser: jest.fn(),
};

const mockEbaySearchService = {
  search: jest.fn(),
};

const useCase = new ProcessSearchUseCase(
  mockUserService,
  mockEbaySearchService,
  costPerRequest,
  mockLogger
);

// Tests...
```

### Advantages:
- ✅ Easy to mock dependencies
- ✅ Isolated logic testing
- ✅ Fast tests (without DB/API)

## 📊 Logging

Winston logger is integrated at all levels:

```typescript
// Development
[10:30:45] [debug]: User obtained { userId: 123, balance: 1000 }
[10:30:46] [info]: Starting eBay search { partNumbersCount: 3 }
[10:30:47] [info]: Search completed { foundItems: 2 }

// Production (JSON)
{"timestamp":"2025-11-23T10:30:45Z","level":"info","message":"Search completed","meta":{"foundItems":2}}
```

## ⚙️ Configuration (Zod)

All environment variables are validated at startup:

```typescript
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  ADMIN_USER_ID: z.string().regex(/^\d+$/).transform(Number),
  EBAY_CLIENT_ID: z.string().min(1),
  EBAY_CLIENT_SECRET: z.string().min(1),
  STRIPE_PROVIDER_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});
```

In case of a validation error, a detailed message indicating the problem is shown.

## 🚀 Application Startup

### Manual Dependency Injection in index.ts:

```typescript
class Application {
  async start() {
    // 1. Load and validate config
    const env = loadEnv();
    const configs = createConfigs(env);
    
    // 2. Create logger
    const logger = createLogger(env);
    
    // 3. Initialize DB
    const db = new DatabaseConnection(...);
    await db.connect();
    
    // 4. Create repositories
    const userRepo = new SqliteUserRepository(db, logger);
    const couponRepo = new SqliteCouponRepository(db, logger);
    
    // 5. Create infrastructure clients
    const browseApi = new EbayBrowseApiClient(...);
    const findingApi = new EbayFindingApiClient(...);
    
    // 6. Create services
    const userService = new UserService(userRepo, ...);
    const ebaySearchService = new EbaySearchService(...);
    
    // 7. Create use-cases
    const processSearchUseCase = new ProcessSearchUseCase(...);
    
    // 8. Create handlers
    const messageHandler = new MessageHandler(...);
    messageHandler.register();
    
    // 9. Start the bot
    await botAdapter.startPolling();
    
    // 10. Graceful shutdown
    setupGracefulShutdown();
  }
}
```

## 🛡️ Graceful Shutdown

The application shuts down correctly upon receiving SIGTERM/SIGINT:

1. Stops Telegram polling
2. Closes the database connection
3. Logs the shutdown
4. Exits with code 0

## 📝 Migration from the Old Structure

### Old structure (monolith):
```
src/
├── bot.ts          # 300+ lines, all in one file
├── ebay.ts         # Mixed API calls and logic
├── database.ts     # Direct SQL queries
└── utils.ts        # Everything else
```

### New structure (Clean Architecture):
```
src/
├── domain/         # Business logic, framework-independent
├── application/    # Use cases, services
├── infrastructure/ # Implementation details
└── presentation/   # UI layer
```

## 🎓 Future Improvements

1. **Unit Tests for Use Cases**: Cover all scenarios with mocked tests
2. **Integration Tests**: Tests with real DB (in-memory SQLite)
3. **E2E Tests**: Complete flow from Telegram to Excel
4. **Monitoring**: Add metrics (Prometheus) and tracing
5. **Error Recovery**: Retry mechanisms for API calls
6. **Caching**: Cache search results
7. **Rate Limiting**: Application-level spam protection

## 📚 Useful Resources

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---
