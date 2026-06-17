ALTER TABLE public.subscription_requests
  DROP CONSTRAINT IF EXISTS subscription_requests_payment_method_check;

ALTER TABLE public.subscription_requests
  ADD CONSTRAINT subscription_requests_payment_method_check
  CHECK (payment_method IN ('bank', 'stc_pay', 'paypal'));
