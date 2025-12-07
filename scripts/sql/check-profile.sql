
SELECT * FROM public.user_profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@mvpvideo.test');
