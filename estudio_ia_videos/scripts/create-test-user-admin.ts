import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Need SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('Please add: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUserDirect() {
  const email = 'test@example.com';
  const password = 'Test123456!';

  console.log(`Creating user with service role: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: 'Test User'
    }
  });

  if (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }

  console.log('✅ User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);
}

createTestUserDirect();
