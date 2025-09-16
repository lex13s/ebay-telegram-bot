import { initializeBot } from './bot';
import { initDb } from './database';

async function main() {
  try {
    await initDb();
    initializeBot();
  } catch (error) {
    console.error('Не удалось запустить приложение:', error);
    process.exit(1);
  }
}

main().catch(console.error);
