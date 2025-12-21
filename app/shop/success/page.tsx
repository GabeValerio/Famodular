'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export default function PaymentSuccess() {
  const [isVerified, setIsVerified] = useState(false);
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    // Simulate payment verification
    const verifyPayment = async () => {
      if (!paymentIntentId) {
        setIsVerified(true);
        return;
      }

      // In a real implementation, you'd verify the payment with your backend
      // For demo purposes, we'll just simulate success
      setTimeout(() => {
        setIsVerified(true);
      }, 1000);
    };

    verifyPayment();
  }, [paymentIntentId]);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h1 className="text-xl font-semibold text-gray-900">
              Verifying your payment...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg">
        <div className="text-center p-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {amount && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                ${parseFloat(amount).toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full" size="lg">
                Continue Shopping
              </Button>
            </Link>

            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
