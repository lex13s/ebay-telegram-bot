# Clean Architecture - eBay Bot

## 🏗️ Общая структура архитектуры

Проект полностью рефакторен с применением принципов Clean Architecture (Чистая архитектура). Код разделён на 4 основных слоя, каждый из которых имеет чётко определённую ответственность.

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

## 📁 Структура проекта

```
src/
├── domain/                          # Доменный слой (бизнес-логика)
│   ├── entities/                    # Сущности с бизнес-правилами
│   │   ├── User.ts                  # Пользователь (баланс, настройки)
│   │   ├── Coupon.ts                # Купон (активация, проверка)
│   │   └── SearchResult.ts          # Результат поиска
│   ├── value-objects/               # Неизменяемые объекты-значения
│   │   ├── UserId.ts                # ID пользователя
│   │   ├── Balance.ts               # Баланс (в центах)
│   │   ├── PartNumber.ts            # Номер детали
│   │   ├── CouponCode.ts            # Код купона
│   │   └── SearchConfigKey.ts       # Тип поиска (ACTIVE/SOLD/ENDED)
│   ├── repositories/                # Интерфейсы репозиториев
│   │   ├── IUserRepository.ts       # Контракт для работы с User
│   │   └── ICouponRepository.ts     # Контракт для работы с Coupon
│   └── errors/                      # Доменные ошибки
│       └── DomainErrors.ts          # InsufficientFundsError, InvalidCouponError...
│
├── application/                     # Слой приложения (use-cases)
│   ├── use-cases/                   # Бизнес-сценарии
│   │   ├── ProcessSearchUseCase.ts  # Обработка поиска деталей
│   │   ├── RedeemCouponUseCase.ts   # Активация купона
│   │   ├── GenerateCouponUseCase.ts # Генерация купона (admin)
│   │   └── UpdateSearchSettingsUseCase.ts # Изменение настроек поиска
│   └── services/                    # Сервисы (оркестрация)
│       ├── UserService.ts           # Работа с пользователями
│       ├── CouponService.ts         # Работа с купонами
│       └── EbaySearchService.ts     # Поиск на eBay
│
├── infrastructure/                  # Инфраструктурный слой
│   ├── config/                      # Конфигурация
│   │   ├── EnvConfig.ts             # Валидация .env через Zod
│   │   ├── AppConfig.ts             # Конфиг приложения
│   │   ├── TelegramConfig.ts        # Конфиг Telegram
│   │   ├── EbayConfig.ts            # Конфиг eBay API
│   │   └── PaymentConfig.ts         # Конфиг платежей
│   ├── logging/                     # Логирование
│   │   └── Logger.ts                # Winston logger с транспортами
│   ├── database/                    # База данных
│   │   ├── DatabaseConnection.ts    # SQLite подключение
│   │   ├── SqliteUserRepository.ts  # Реализация IUserRepository
│   │   └── SqliteCouponRepository.ts # Реализация ICouponRepository
│   ├── ebay/                        # eBay API клиенты
│   │   ├── EbayBrowseApiClient.ts   # Browse API (активные)
│   │   ├── EbayFindingApiClient.ts  # Finding API (проданные/завершённые)
│   │   └── EbaySearchConfigFactory.ts # Фабрика конфигов
│   ├── telegram/                    # Telegram Bot API
│   │   └── TelegramBotAdapter.ts    # Адаптер для Telegram Bot
│   └── excel/                       # Генерация отчётов
│       └── ExcelReportGenerator.ts  # Excel файлы с результатами
│
├── presentation/                    # Слой представления
│   ├── handlers/                    # Обработчики событий
│   │   ├── StartCommandHandler.ts   # /start команда
│   │   ├── MessageHandler.ts        # Текстовые сообщения
│   │   ├── CallbackQueryHandler.ts  # Inline кнопки
│   │   └── PaymentHandler.ts        # Платежи
│   ├── keyboards/                   # Клавиатуры
│   │   └── KeyboardBuilder.ts       # Фабрика клавиатур
│   └── messages/                    # Сообщения
│       └── MessageTemplates.ts      # Шаблоны текстов
│
├── shared/                          # Общие утилиты
│   ├── constants/                   # Константы
│   ├── types/                       # Общие типы
│   └── utils/                       # Вспомогательные функции
│
└── index.ts                         # Точка входа с DI composition
```

## 🔄 Поток данных

### Пример: Поиск деталей

```
1. User отправляет сообщение с номерами деталей
   ↓
2. MessageHandler получает событие
   ↓
3. MessageHandler вызывает ProcessSearchUseCase
   ↓
4. ProcessSearchUseCase:
   - Получает/создаёт User через UserService
   - Проверяет баланс
   - Списывает средства
   - Вызывает EbaySearchService для поиска
   ↓
5. EbaySearchService:
   - Определяет тип поиска (Browse/Finding API)
   - Выполняет поиск через соответствующий клиент
   - Возвращает SearchResult[]
   ↓
6. ProcessSearchUseCase:
   - Если результатов нет → возврат средств
   - Если есть → продолжает
   ↓
7. MessageHandler:
   - Генерирует Excel через ExcelReportGenerator
   - Отправляет файл пользователю
   - Показывает главное меню
```

## 🎯 Ключевые принципы

### 1. Dependency Inversion Principle (DIP)
- Domain слой не зависит от Infrastructure
- Все зависимости направлены внутрь (к Domain)
- Интерфейсы определены в Domain, реализация в Infrastructure

### 2. Single Responsibility Principle (SRP)
- Каждый класс имеет одну ответственность
- Use Cases инкапсулируют один бизнес-сценарий
- Handlers только принимают события и делегируют Use Cases

### 3. Open/Closed Principle (OCP)
- Легко добавить новый Use Case без изменения существующих
- Новые handlers добавляются без модификации других
- Расширяемость через интерфейсы

## 🧪 Тестируемость

### Unit тесты для Use Cases
```typescript
// Пример: ProcessSearchUseCase.test.ts
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

// Тесты...
```

### Преимущества:
- ✅ Легко мокировать зависимости
- ✅ Изолированное тестирование логики
- ✅ Быстрые тесты (без БД/API)

## 📊 Логирование

Winston logger интегрирован на всех уровнях:

```typescript
// Development
[10:30:45] [debug]: User obtained { userId: 123, balance: 1000 }
[10:30:46] [info]: Starting eBay search { partNumbersCount: 3 }
[10:30:47] [info]: Search completed { foundItems: 2 }

// Production (JSON)
{"timestamp":"2025-11-23T10:30:45Z","level":"info","message":"Search completed","meta":{"foundItems":2}}
```

## ⚙️ Конфигурация (Zod)

Все environment переменные валидируются при старте:

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

При ошибке валидации - подробное сообщение с указанием проблемы.

## 🚀 Запуск приложения

### Manual Dependency Injection в index.ts:

```typescript
class Application {
  async start() {
    // 1. Загрузка и валидация конфига
    const env = loadEnv();
    const configs = createConfigs(env);
    
    // 2. Создание logger
    const logger = createLogger(env);
    
    // 3. Инициализация БД
    const db = new DatabaseConnection(...);
    await db.connect();
    
    // 4. Создание repositories
    const userRepo = new SqliteUserRepository(db, logger);
    const couponRepo = new SqliteCouponRepository(db, logger);
    
    // 5. Создание infrastructure клиентов
    const browseApi = new EbayBrowseApiClient(...);
    const findingApi = new EbayFindingApiClient(...);
    
    // 6. Создание services
    const userService = new UserService(userRepo, ...);
    const ebaySearchService = new EbaySearchService(...);
    
    // 7. Создание use-cases
    const processSearchUseCase = new ProcessSearchUseCase(...);
    
    // 8. Создание handlers
    const messageHandler = new MessageHandler(...);
    messageHandler.register();
    
    // 9. Запуск бота
    await botAdapter.startPolling();
    
    // 10. Graceful shutdown
    setupGracefulShutdown();
  }
}
```

## 🛡️ Graceful Shutdown

Приложение корректно завершает работу при получении SIGTERM/SIGINT:

1. Останавливает Telegram polling
2. Закрывает соединение с БД
3. Логирует завершение
4. Выходит с кодом 0

## 📝 Миграция со старой структуры

### Старая структура (монолит):
```
src/
├── bot.ts          # 300+ строк, всё в одном файле
├── ebay.ts         # Смешаны API calls и логика
├── database.ts     # Прямые SQL запросы
└── utils.ts        # Всё подряд
```

### Новая структура (Clean Architecture):
```
src/
├── domain/         # Бизнес-логика, независимая от фреймворков
├── application/    # Use cases, сервисы
├── infrastructure/ # Детали реализации
└── presentation/   # UI слой
```

## 🎓 Дальнейшие улучшения

1. **Unit тесты для Use Cases**: Покрыть все сценарии тестами с моками
2. **Integration тесты**: Тесты с реальной БД (in-memory SQLite)
3. **E2E тесты**: Полный flow от Telegram до Excel
4. **Monitoring**: Добавить метрики (Prometheus) и трейсинг
5. **Error Recovery**: Retry механизмы для API calls
6. **Caching**: Кэширование результатов поиска
7. **Rate Limiting**: Защита от спама на уровне приложения

## 📚 Полезные ресурсы

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

