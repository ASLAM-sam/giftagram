/**
 * Payment Gateway Service (Razorpay Integration Ready)
 * 
 * Future Architecture:
 * 1. Client calls backend: `POST /api/payments/razorpay/create-order` with deposit amount.
 * 2. Backend generates Razorpay Order via Razorpay Node SDK with key_secret.
 * 3. Client opens Razorpay modal with `order_id` and options.
 * 4. On payment completion, client verifies signature via backend `POST /api/payments/razorpay/verify`.
 */

export interface RazorpayOptions {
  key?: string;
  amount: number; // in paise (e.g. 39950 for ₹399.50)
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
}

export interface PaymentInitiationResult {
  success: boolean;
  gateway: 'razorpay';
  mode: 'simulation';
  depositAmount: number;
  message: string;
}

export const paymentService = {
  /**
   * Prepares and initiates payment.
   * Currently provides a clean simulated payment completion for the frontend flow.
   * 
   * TODO: Connect real Razorpay Checkout script:
   * const options: RazorpayOptions = {
   *   key: process.env.VITE_RAZORPAY_KEY_ID,
   *   amount: Math.round(depositAmount * 100),
   *   currency: "INR",
   *   name: BRAND_CONFIG.name,
   *   description: `50% Non-Refundable Deposit for Order ${orderId}`,
   *   handler: function (response) { ... verify on backend ... }
   * };
   * const rzp = new window.Razorpay(options);
   * rzp.open();
   */
  async processDepositPayment(
    orderId: string,
    depositAmount: number,
    customerName: string,
    customerPhone: string
  ): Promise<PaymentInitiationResult> {
    console.info(`[PaymentService] Initiating deposit payment for order ${orderId}: ₹${depositAmount}`);
    
    // Simulate brief payment gateway authorization
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      gateway: 'razorpay',
      mode: 'simulation',
      depositAmount,
      message: `Simulated deposit payment of ₹${depositAmount} processed successfully.`,
    };
  },
};
