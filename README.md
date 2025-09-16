# eBay Part Finder Bot

This is a Telegram bot that finds prices and listing titles for auto parts on eBay. It's a usage-based paid bot with a trial balance for new users.

## Features

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
# Set to 'production' for live environment, otherwise sandbox will be used
NODE_ENV=development

# --- Telegram ---
# Get your bot token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

# Get a payment provider token from @BotFather (e.g., Stripe)
STRIPE_PROVIDER_TOKEN=YOUR_STRIPE_PROVIDER_TOKEN_HERE

# Your personal Telegram User ID for admin commands
ADMIN_USER_ID=YOUR_TELEGRAM_ID_HERE

# --- eBay API ---
# Get these from the eBay Developers Program: https://developer.ebay.com/
EBAY_CLIENT_ID=YOUR_EBAY_APP_ID_HERE
EBAY_CLIENT_SECRET=YOUR_EBAY_CLIENT_SECRET_HERE
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