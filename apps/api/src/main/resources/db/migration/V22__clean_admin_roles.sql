-- Remove unintended PATIENT role from administrator accounts
DELETE FROM user_role
WHERE role = 'PATIENT'
  AND user_id IN (
    SELECT user_id FROM user_role WHERE role = 'ADMIN'
  );
