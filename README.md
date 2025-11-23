# eBay Part Finder Bot

This is a Telegram bot that finds prices and listing titles for auto parts on eBay. It's a usage-based paid bot with a trial balance for new users.

## Features

- **Modular Architecture**: The bot is built with a modular architecture, separating concerns for easier maintenance and development.
- **Strict Typing**: The project uses TypeScript and defines strict types for external API interactions, ensuring code quality and preventing common errors.
- **Paid Usage Model**: Each search query costs a small fee, deducted from the user's balance.
- **User Balances**: Each user has a persistent balance stored in a SQLite database.
- **Trial Balance**: New users receive a small starting balance to test the bot.
- **Top-up Balance**: Users can add funds to their balance via Stripe.
- **Coupon System**: Admins can generate coupon codes for users to redeem for balance.
- **Part Number Search**: Accepts multiple part numbers in a single message.
- **eBay API Integration**: Queries the eBay API for each part number.
- **Excel Reports**: Generates a `.xlsx` file with the search results.

---

## Commands

### User Commands
- `/start` - Initialize the bot and see your balance.
- `/balance` - Check your current balance.
- `/topup` - Receive a payment link to add funds to your balance.
- `/redeem <code>` - Redeem a coupon to add funds to your balance.

### Admin Commands
- `/generatecoupon <amount>` - Generate a new coupon with a specified value in USD.

---

## Architecture

**🏗️ Clean Architecture Implementation (v2.0)**

This project follows Clean Architecture principles with clear separation of concerns across four layers:

### 📦 Layer Structure

```
src/
├── domain/          # Business logic (entities, value objects, interfaces)
├── application/     # Use cases and services
├── infrastructure/  # External services (DB, APIs, logging)
└── presentation/    # User interface (Telegram handlers, keyboards)
```

**Key Components:**

- **Domain Layer**: `User`, `Coupon`, `SearchResult` entities with business rules
- **Application Layer**: Use cases (`ProcessSearchUseCase`, `RedeemCouponUseCase`) orchestrating business logic
- **Infrastructure Layer**: 
  - Database: `SqliteUserRepository`, `SqliteCouponRepository`
  - eBay API: `EbayBrowseApiClient`, `EbayFindingApiClient`
  - Logging: Winston with structured logging
  - Config: Zod-validated environment variables
- **Presentation Layer**: Telegram bot handlers, keyboards, message templates

**📚 For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md)**

### ✨ Architecture Benefits

- ✅ **Testability**: Easy to mock dependencies for unit testing
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Easy to add new features
- ✅ **Type Safety**: Value Objects and strict TypeScript
- ✅ **Logging**: Winston structured logging on all levels
- ✅ **Validation**: Zod schema validation for configuration

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or newer)
- [npm](https://www.npmjs.com/)

### 1. Installation

Clone the repository and install the dependencies.

```bash
npm install
```

### 2. Configuration

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```dotenv
# --- Telegram ---
# Get your bot token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

# Your personal Telegram User ID for admin commands
ADMIN_USER_ID=YOUR_TELEGRAM_ID_HERE

# --- eBay API ---
# Get these from the eBay Developers Program: https://developer.ebay.com/
EBAY_CLIENT_ID=YOUR_EBAY_APP_ID_HERE
EBAY_CLIENT_SECRET=YOUR_EBAY_CLIENT_SECRET_HERE

# --- Payments (Optional) ---
# Get a payment provider token from @BotFather (e.g., Stripe)
# If this is not provided, the payment functionality will be disabled.
STRIPE_PROVIDER_TOKEN=YOUR_STRIPE_PROVIDER_TOKEN_HERE
```

### 3. Running the Bot

First, compile the TypeScript code:

```bash
npm run build
```

Then, start the bot:

```bash
npm start
```

### 4. Running Tests

To run the unit tests, use the following command:

```bash
npm test
```

---

---

## 🚀 Deployment

### Heroku Deployment

#### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Heroku account ([Sign up](https://signup.heroku.com/))

#### Quick Deploy

```bash
# Login to Heroku
heroku login

# Create new app (or use existing)
heroku create your-ebay-bot

# Set required environment variables
heroku config:set \
  TELEGRAM_BOT_TOKEN=your_telegram_bot_token \
  ADMIN_USER_ID=your_numeric_telegram_id \
  EBAY_CLIENT_ID=your_ebay_client_id \
  EBAY_CLIENT_SECRET=your_ebay_client_secret \
  NODE_ENV=production

# Optional: Enable payments
heroku config:set STRIPE_PROVIDER_TOKEN=your_stripe_token

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

#### Configuration Management

**View all config vars:**
```bash
heroku config
```

**Get specific variable:**
```bash
heroku config:get TELEGRAM_BOT_TOKEN
```

**Remove variable:**
```bash
heroku config:unset STRIPE_PROVIDER_TOKEN
```

**Important Notes:**
- ⚠️ Use `ADMIN_USER_ID=123` (not `\ADMIN_USER_ID`)
- ✅ The app validates all configs on startup (Zod schemas)
- ✅ Heroku auto-restarts after config changes
- ✅ SQLite database persists in Heroku's ephemeral filesystem (consider Postgres for production)

#### Procfile

The included `Procfile` runs:
```
worker: node dist/index.js
```

**Note**: Bot uses polling (not webhooks), so `worker` dyno type is required, not `web`.

---

## 📋 Project Status

**Version**: 2.0.0 (Clean Architecture)  
**Status**: ✅ Production Ready  
**Last Major Update**: November 23, 2025  

### Recent Changes (v2.0)
- ✅ Complete architecture refactoring to Clean Architecture
- ✅ 73 TypeScript files with SOLID principles
- ✅ Winston structured logging
- ✅ Zod configuration validation
- ✅ Value Objects pattern
- ✅ Repository pattern with SQLite
- ✅ Dual eBay API support (Browse + Finding)
- ✅ 0 compilation errors
- ✅ Optimized imports using barrel exports

See [docs/changelog.md](docs/changelog.md) for complete history.

---

## 🤝 Contributing

This project follows Clean Architecture principles. When contributing:

1. **Respect layer boundaries** - dependencies point inward
2. **Use Value Objects** - avoid primitive obsession
3. **Write tests** - especially for use-cases
4. **Follow SOLID** - Single Responsibility, Open/Closed, etc.
5. **Type everything** - strict TypeScript mode enabled

See [docs/architecture.md](docs/architecture.md) for architectural guidelines.

---

## 📄 License

This project is licensed under the ISC License.

---

## 🆘 Support

- **Documentation**: See `docs/` folder
- **Architecture Guide**: [docs/architecture.md](docs/architecture.md)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **Changelog**: [docs/changelog.md](docs/changelog.md)
