/**
 * Message templates for bot responses
 */
export class MessageTemplates {
  // Greeting messages
  public static start(firstName: string): string {
    return `👋 Hello, ${firstName}!\n\nPlease send me one or more part numbers to search.`;
  }

  public static mainMenu(balance: string): string {
    return `Your current balance: $${balance}.\n\nPlease select an action:`;
  }

  // Processing messages
  public static processing(): string {
    return '⚙️ Processing your request...';
  }

  public static searching(count: number): string {
    return `Searching for information on ${count} part number(s)...`;
  }

  public static searchComplete(): string {
    return '✅ Search complete. Creating Excel report...';
  }

  // Balance messages
  public static currentBalance(balance: string): string {
    return `Your current balance: $${balance}`;
  }

  public static insufficientFunds(): string {
    return '🚫 Insufficient funds in your balance to complete the request.';
  }

  public static requestComplete(cost: string, balance: string): string {
    return `✅ Request completed! $${cost} has been deducted from your balance. Remaining balance: $${balance}.`;
  }

  public static requestCompleteFree(): string {
    return '✅ Request completed!';
  }

  // Error messages
  public static noPartNumbers(): string {
    return 'Please enter at least one part number.';
  }

  public static error(): string {
    return 'An unexpected error occurred. Please try again.';
  }

  public static noItemsFound(): string {
    return '❌ Nothing found for your request.';
  }

  public static noItemsFoundAndRefund(balance: string): string {
    return `❌ Nothing found for your request. Funds have been returned to your balance. Current balance: $${balance}`;
  }

  public static refundOnError(balance: string): string {
    return `⚠️ An error occurred while processing your request. Funds have been returned to your balance. Current balance: $${balance}`;
  }

  // Coupon messages
  public static enterCouponCode(): string {
    return 'Please enter your coupon code:';
  }

  public static redeemCouponNotFound(): string {
    return '❌ Coupon not found or already used.';
  }

  public static redeemCouponSuccess(amount: string, balance: string): string {
    return `✅ Coupon successfully activated!\nYour balance has been topped up by $${amount}.\nNew balance: $${balance}.`;
  }

  // Admin messages
  public static adminOnly(): string {
    return '⛔️ This command is available only to the administrator.';
  }

  public static enterCouponValue(): string {
    return 'Enter the coupon amount in dollars (e.g., 10 or 5.50):';
  }

  public static generateCouponSuccess(code: string, amount: string): string {
    return `✅ New coupon created:\n\nCode: ${code}\nAmount: $${amount}`;
  }

  public static generateCouponError(): string {
    return '❌ Error creating coupon.';
  }

  // Payment messages
  public static paymentsDisabled(): string {
    return 'Unfortunately, the payment function is temporarily disabled. Please try again later.';
  }

  public static invoiceTitle(): string {
    return 'Balance Top-up';
  }

  public static invoiceDescription(cost: string): string {
    return `Purchase of bot credits for $${cost}`;
  }

  public static paymentSuccess(amount: string, balance: string): string {
    return `✅ Payment successful!\n\nYour balance has been topped up by $${amount}.\nCurrent balance: $${balance}.`;
  }
}
