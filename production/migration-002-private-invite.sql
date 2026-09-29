-- Apply once to the existing Production D1. The payload is browser-encrypted.
ALTER TABLE single_use_invites ADD COLUMN encrypted_master TEXT;
