
# eBay Part Finder Telegram Bot

This is a Telegram bot that helps you find the price and listing title for auto parts on eBay by providing a list of part numbers.

## Features

- **Part Number Search**: Accepts a list of part numbers from a user.
- **eBay API Integration**: Queries the eBay Finding API for each part number.
- **Excel Reports**: Generates a `.xlsx` Excel file with the results (Part Number, Title, Price).
- **TypeScript**: Written in TypeScript for robustness and maintainability.
- **Unit Tested**: Core modules are covered by unit tests using Jest.

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Installation

Clone the repository and install the dependencies.

```bash
npm install
```

### 2. Configuration

You need to provide API keys for Telegram and eBay. 

1.  Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

2.  Edit the `.env` file with your credentials:

    ```dotenv
    # Get your token from BotFather on Telegram
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

    # Get your App ID from the eBay Developers Program
    # https://developer.ebay.com/
    EBAY_APP_ID=YOUR_EBAY_APP_ID_HERE
    ```

    -   `TELEGRAM_BOT_TOKEN`: Create a new bot by talking to [@BotFather](https://t.me/BotFather) on Telegram.
    -   `EBAY_APP_ID`: Get this from the [eBay Developers Program](https://developer.ebay.com/) by creating a new application.

### 3. Running the Bot

First, you need to compile the TypeScript code:

```bash
npm run build
```

Then, you can start the bot:

```bash
npm start
```

Your bot should now be running and responding to messages on Telegram.

### 4. Running Tests

To run the unit tests, use the following command:

```bash
npm test
```
