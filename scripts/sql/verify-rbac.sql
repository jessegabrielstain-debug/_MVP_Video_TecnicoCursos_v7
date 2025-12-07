
SELECT 
  u.email,
  r.name as role
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.email LIKE '%@mvpvideo.test';
