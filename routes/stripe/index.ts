import express from 'express';
import {
  createCheckoutSession,
  activateTrial,
  getSubscriptionStatus,
  cancelSubscription
} from '../../controllers/stripe';

const router = express.Router();

// Create Stripe checkout session
router.post('/create-checkout-session', createCheckoutSession);

// Activate Pro Trial
router.post('/activate-trial', activateTrial);

// Get subscription status
router.get('/subscription-status', getSubscriptionStatus);

// Cancel subscription
router.post('/cancel-subscription', cancelSubscription);

export default router;
