'use client';

import { useEffect } from 'react';
import { clearCart } from '../_shop/cart';

/** Empties the cart once Stripe sends the buyer back paid. */
export function ClearCart() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('session_id')) clearCart();
  }, []);
  return null;
}
