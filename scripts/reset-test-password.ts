
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const email = 'admin@mvpvideo.test';
  const password = 'senha123';

  console.log(`Resetting password for ${email}...`);

  // First, find the user to get the ID (optional, but good for verification)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found!');
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: password, email_confirm: true }
  );

  if (error) {
    console.error('Error updating user:', error);
  } else {
    console.log('Password updated successfully for user:', data.user.email);
  }
}

resetPassword();
