import { EnvConfig } from './EnvConfig';

/**
 * Application configuration
 */
export interface AppConfig {
  database: {
    name: string;
  };
  payments: {
    enabled: boolean;
    amountCents: number;
    currency: string;
  };
  pricing: {
    trialBalanceCents: number;
    costPerRequestCents: number;
  };
}

export function createAppConfig(env: EnvConfig): AppConfig {
  const paymentsEnabled = !!env.STRIPE_PROVIDER_TOKEN;

  return {
    database: {
      name: 'bot_database.sqlite',
    },
    payments: {
      enabled: paymentsEnabled,
      amountCents: 2000, // $20.00
      currency: 'USD',
    },
    pricing: {
      trialBalanceCents: 1000, // $10.00
      costPerRequestCents: 10, // $0.10
    },
  };
}
