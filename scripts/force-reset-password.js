
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const targetEmail = 'admin@mvpvideo.test';
const newPassword = 'password123';

async function resetPassword() {
  console.log(`🔄 Resetting password for ${targetEmail}...`);

  // 1. Get User ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === targetEmail);

  if (!user) {
    console.log(`⚠️ User ${targetEmail} not found. Creating it...`);
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: newPassword,
      email_confirm: true,
      user_metadata: { role: 'admin', name: 'Admin User' }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
    } else {
      console.log('✅ User created successfully with password:', newPassword);
    }
    return;
  }

  // 2. Update Password
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('❌ Error updating password:', updateError.message);
  } else {
    console.log('✅ Password updated successfully to:', newPassword);
  }
}

resetPassword();
