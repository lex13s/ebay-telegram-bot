import { z } from 'zod';

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  ADMIN_USER_ID: z.string().regex(/^\d+$/, 'ADMIN_USER_ID must be a number').transform(Number),

  // eBay
  EBAY_CLIENT_ID: z.string().min(1, 'EBAY_CLIENT_ID is required'),
  EBAY_CLIENT_SECRET: z.string().min(1, 'EBAY_CLIENT_SECRET is required'),

  // Payments (optional)
  STRIPE_PROVIDER_TOKEN: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

/**
 * Load and validate environment variables
 */
export function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed');
  }

  return result.data;
}

export type EnvConfig = z.infer<typeof envSchema>;

