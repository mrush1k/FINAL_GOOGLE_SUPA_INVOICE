// Apple Pay types
interface ApplePaySession {
  static canMakePayments(): boolean
  static STATUS_SUCCESS: number
  static STATUS_FAILURE: number
  
  constructor(version: number, paymentRequest: any)
  begin(): void
  completePayment(status: number): void
  onvalidatemerchant: (event: any) => void
  onpaymentauthorized: (event: any) => void
}

interface Window {
  ApplePaySession?: typeof ApplePaySession
  PaymentRequest?: typeof PaymentRequest
}

// Google Pay / Payment Request API types
interface PaymentRequest {
  constructor(supportedInstruments: any[], details: any, options?: any)
  show(): Promise<any>
  canMakePayment(): Promise<boolean>
}