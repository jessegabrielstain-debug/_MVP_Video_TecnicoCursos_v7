
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

async function checkProfile() {
  const email = 'admin@mvpvideo.test';
  console.log(`Checking profile for ${email}...`);

  // Get User ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found in Auth!');
    return;
  }
  console.log('User ID:', user.id);

  // Check Profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error checking profile:', profileError);
    // Check if table exists by listing tables? No, just assume error means issue.
    if (profileError.code === '42P01') {
        console.error('Table user_profiles does not exist!');
    }
    return;
  }

  if (profile) {
    console.log('Profile found:', profile);
  } else {
    console.log('Profile NOT found for user.');
    // Create it
    console.log('Creating profile...');
    const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
            id: user.id,
            full_name: 'Admin User',
            email: email,
            avatar_url: 'https://github.com/shadcn.png',
            role: 'admin'
        });
    
    if (insertError) {
        console.error('Error creating profile:', insertError);
    } else {
        console.log('Profile created successfully!');
    }
  }
}

checkProfile();
