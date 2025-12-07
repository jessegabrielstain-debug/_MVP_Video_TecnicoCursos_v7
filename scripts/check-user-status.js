
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'admin@mvpvideo.test';
  console.log(`🔍 Checking status for ${email}...`);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found!');
  } else {
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email Confirmed At: ${user.email_confirmed_at}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   App Metadata:`, user.app_metadata);
    console.log(`   User Metadata:`, user.user_metadata);
  }
}

checkUser();
