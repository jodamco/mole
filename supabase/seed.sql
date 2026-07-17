DO $$
DECLARE
  test_user_id uuid := '11111111-1111-1111-1111-111111111111';
  test_email text := 'test@mole.dev';
BEGIN
   INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    test_email,
    crypt('test1234', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    jsonb_build_object('sub', test_user_id, 'email', test_email),
    'email',
    test_email,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.users (
    user_id,
    first_name,
    last_name,
    storage_path
  ) VALUES (
    test_user_id,
    'Test',
    'User',
    'user-' || test_user_id::text
  )
  ON CONFLICT (user_id) DO NOTHING;
END $$;
