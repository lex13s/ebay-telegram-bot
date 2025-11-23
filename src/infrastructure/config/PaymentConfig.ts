import { EnvConfig } from './EnvConfig';

/**
 * Payment configuration
 */
export interface PaymentConfig {
  enabled: boolean;
  stripeToken: string | undefined;
}

export function createPaymentConfig(env: EnvConfig): PaymentConfig {
  return {
    enabled: !!env.STRIPE_PROVIDER_TOKEN,
    stripeToken: env.STRIPE_PROVIDER_TOKEN,
  };
}

