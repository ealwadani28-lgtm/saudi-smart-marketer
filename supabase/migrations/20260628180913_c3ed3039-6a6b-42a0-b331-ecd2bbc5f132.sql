
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS proof_path text,
  ADD COLUMN IF NOT EXISTS extracted_amount numeric,
  ADD COLUMN IF NOT EXISTS extracted_currency text,
  ADD COLUMN IF NOT EXISTS extracted_reference text,
  ADD COLUMN IF NOT EXISTS extracted_payee text,
  ADD COLUMN IF NOT EXISTS extracted_date text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','auto_verified','needs_review','rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_attempts integer NOT NULL DEFAULT 0;

-- Storage policies: only service_role accesses payment-proofs bucket
-- (uploads happen via secure server function using admin client)
DROP POLICY IF EXISTS "service_role full access payment-proofs" ON storage.objects;
CREATE POLICY "service_role full access payment-proofs"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');
