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

- `src/bot.ts`: Handles the main Telegram bot logic, including command processing and user interactions.
- `src/ebay.ts`: Contains the core functionality for searching items on eBay.
- `src/ebayApi.ts`: Manages all interactions with the eBay API, including authentication and data fetching.
- `src/excel.ts`: Responsible for generating Excel reports with search results.
- `src/database.ts`: Manages the SQLite database for user balances and coupons.
- `src/paymentHandlers.ts`: Handles payment processing via Stripe.
- `src/constants.ts`: Stores all constant values used throughout the application.
- `src/config.ts`: Manages configuration and environment variables.
- `src/utils.ts`: Provides utility functions used across the project.
- `src/types/ebay-api.d.ts`: Contains type definitions for the eBay API responses.

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

## Deploying to Heroku and Setting Environment Variables via Terminal

Note on Heroku config:set syntax (Русский): команду нужно писать без обратного слеша перед именем переменной. Правильно: `heroku config:set ADMIN_USER_ID=123`. Неправильно: `config:set \ADMIN_USER_ID=123`.

- Пример (bash/macOS/Linux): `heroku config:set ADMIN_USER_ID=123`
- Пример (Windows PowerShell): `heroku config:set ADMIN_USER_ID=123`
- Пример (Windows cmd.exe): `heroku config:set ADMIN_USER_ID=123`

Проверить значение: `heroku config:get ADMIN_USER_ID`. Значение должно быть числом, так как приложение парсит его как целое число.

You can deploy this bot to Heroku and configure environment variables (config vars) using the Heroku CLI.

### Prerequisites
- Install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
- Log in: `heroku login`

### 1) Create or select an app
```bash
# From the project root
heroku create  # creates a new random-named app and adds a git remote "heroku"
# or, if you already have an app:
# heroku git:remote -a your-app-name
```

(Optional) Rename the app:
```bash
heroku apps:rename your-app-name
```

### 2) Set environment variables (config vars)
Use `heroku config:set` to create/update variables. Example for this project:
```bash
heroku config:set \
  TELEGRAM_BOT_TOKEN=your_telegram_bot_token \
  ADMIN_USER_ID=your_numeric_telegram_id \
  EBAY_CLIENT_ID=your_ebay_app_id \
  EBAY_CLIENT_SECRET=your_ebay_client_secret \
  STRIPE_PROVIDER_TOKEN=your_stripe_provider_token
```

- Show all variables:
```bash
heroku config
```
- Get a single variable:
```bash
heroku config:get EBAY_CLIENT_ID
```
- Unset a variable:
```bash
heroku config:unset STRIPE_PROVIDER_TOKEN
```

Tip: You can also load from a local .env file (bash) with xargs:
```bash
# Beware of spaces/quotes; ensure your .env has KEY=VALUE per line with no spaces around '='
export $(grep -v '^#' .env | xargs) && \
heroku config:set $(grep -v '^#' .env | xargs)
```

### 3) Deploy
Make sure your Procfile exists (it does in this repo). Then push to Heroku:
```bash
git push heroku main  # or 'master' depending on your default branch
```

### 4) View logs
```bash
heroku logs --tail
```

Notes:
- Never commit your real secrets to Git. Use Heroku config vars instead of .env in production.
- After changing config vars, you usually don't need to restart manually; Heroku will restart the dyno automatically.
