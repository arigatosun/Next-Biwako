'use client';

import React from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';

export default function CheckoutForm() {
  return (
    <div>
      <PaymentElement />
    </div>
  );
}
