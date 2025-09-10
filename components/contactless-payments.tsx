"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { QrCode, Smartphone, CreditCard, Zap, ExternalLink, AlertCircle } from 'lucide-react'

interface ContactlessPaymentsProps {
  invoiceId: string
  amount: number
  currency: string
  customerEmail?: string
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
}

export function ContactlessPayments({ 
  invoiceId, 
  amount, 
  currency, 
  customerEmail,
  enabled = false,
  onToggle 
}: ContactlessPaymentsProps) {
  const [applePaySupported, setApplePaySupported] = useState(false)
  const [googlePaySupported, setGooglePaySupported] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    // Check for Apple Pay support
    if (typeof window !== 'undefined' && window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
      setApplePaySupported(true)
    }

    // Check for Google Pay support (Payment Request API)
    if (typeof window !== 'undefined' && window.PaymentRequest) {
      try {
        const supportedInstruments = [{
          supportedMethods: 'https://google.com/pay',
          data: {
            allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD'],
            allowedCardNetworks: ['VISA', 'MASTERCARD'],
            paymentMethodTokenizationParameters: {
              tokenizationType: 'PAYMENT_GATEWAY',
              parameters: {}
            }
          }
        }]

        const details = {
          total: { label: 'Invoice Payment', amount: { currency: currency, value: amount.toString() } }
        }

        const request = new window.PaymentRequest(supportedInstruments, details)
        request.canMakePayment().then(result => {
          setGooglePaySupported(!!result)
        }).catch(() => {
          setGooglePaySupported(false)
        })
      } catch (error) {
        setGooglePaySupported(false)
      }
    }
  }, [amount, currency])

  const handleApplePay = async () => {
    if (!applePaySupported) return

    try {
      const paymentRequest = {
        countryCode: 'AU',
        currencyCode: currency,
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: `Invoice #${invoiceId}`,
          amount: amount.toString()
        }
      }

      const session = new window.ApplePaySession!(3, paymentRequest)
      
      session.onvalidatemerchant = async (event) => {
        // In production, you would validate the merchant with your payment processor
        console.log('Apple Pay merchant validation required')
      }

      session.onpaymentauthorized = async (event) => {
        // Process the payment with your payment processor
        console.log('Apple Pay authorized:', event.payment)
        
        // For demo purposes, we'll simulate success
        session.completePayment(window.ApplePaySession!.STATUS_SUCCESS)
        
        // In production, you would send the payment token to your server
        // await processPayment(event.payment.token)
      }

      session.begin()
    } catch (error) {
      console.error('Apple Pay error:', error)
    }
  }

  const handleGooglePay = async () => {
    if (!googlePaySupported) return

    try {
      const supportedInstruments = [{
        supportedMethods: 'https://google.com/pay',
        data: {
          allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD'],
          allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
          paymentMethodTokenizationParameters: {
            tokenizationType: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe', // Replace with your payment gateway
              gatewayMerchantId: 'your-merchant-id'
            }
          }
        }
      }]

      const details = {
        total: {
          label: `Invoice #${invoiceId}`,
          amount: { currency: currency, value: amount.toString() }
        }
      }

      const request = new window.PaymentRequest!(supportedInstruments, details)
      const result = await request.show()
      
      // Process the payment
      console.log('Google Pay result:', result)
      
      // In production, send to your payment processor
      // await processPayment(result)
      
      result.complete('success')
    } catch (error) {
      console.error('Google Pay error:', error)
    }
  }

  const generateQRCode = () => {
    // Generate a payment QR code URL
    // In production, this would integrate with your payment processor's QR code API
    const paymentUrl = `https://pay.invoiceeasy.app/i/${invoiceId}?amount=${amount}&currency=${currency}`
    return paymentUrl
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  if (!enabled && onToggle) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Enable Contactless Payments</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Allow customers to pay with Apple Pay, Google Pay, or QR codes for faster, contactless transactions.
          </p>
          <Button onClick={() => onToggle(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Enable Contactless Payments
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {onToggle && (
        <div className="flex items-center justify-between">
          <Label htmlFor="contactless-toggle">Contactless Payments</Label>
          <Switch
            id="contactless-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      )}

      {enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Payment Options
            </CardTitle>
            <CardDescription>
              Fast and secure payment methods for {formatAmount(amount, currency)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Apple Pay */}
              {applePaySupported && (
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={handleApplePay}
                >
                  <div className="w-8 h-8 bg-black rounded text-white flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Apple Pay</div>
                    <div className="text-xs text-muted-foreground">Touch ID / Face ID</div>
                  </div>
                </Button>
              )}

              {/* Google Pay */}
              {googlePaySupported && (
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={handleGooglePay}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded text-white flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Google Pay</div>
                    <div className="text-xs text-muted-foreground">One-tap payment</div>
                  </div>
                </Button>
              )}

              {/* QR Code */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">QR Code</div>
                  <div className="text-xs text-muted-foreground">Scan to pay</div>
                </div>
              </Button>
            </div>

            {/* QR Code Display */}
            {showQR && (
              <div className="border rounded-lg p-4 text-center bg-gray-50">
                <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Scan with your phone's camera to pay
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={generateQRCode()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Payment Link
                  </a>
                </Button>
              </div>
            )}

            {/* Browser Support Info */}
            {(!applePaySupported && !googlePaySupported) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Contactless payments require a supported browser. QR code payments are available on all devices.
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Info */}
            <div className="text-xs text-muted-foreground">
              <p>• Payments are processed securely through encrypted connections</p>
              <p>• No card details are stored on our servers</p>
              <p>• Compatible with most major banks and cards</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}