-- Update users to teacher role

-- Update Joy Offere to teacher role
UPDATE users 
SET role = 'teacher'
WHERE id = '6b602f6e-effd-43e1-81aa-0e749e5b1ff9';

-- Update scholardorm to teacher role (was admin)
UPDATE users 
SET role = 'teacher'
WHERE id = 'ddce3d51-9d69-4fb4-ab15-90dc95226981';

-- Verify the updates
SELECT 
  id,
  full_name,
  email,
  role,
  status
FROM users 
WHERE id IN ('6b602f6e-effd-43e1-81aa-0e749e5b1ff9', 'ddce3d51-9d69-4fb4-ab15-90dc95226981')
ORDER BY full_name;