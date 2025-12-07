import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  { email: 'admin@mvpvideo.test', password: 'password123', role: 'admin' },
  { email: 'editor@mvpvideo.test', password: 'password123', role: 'editor' },
  { email: 'viewer@mvpvideo.test', password: 'password123', role: 'viewer' },
  { email: 'moderator@mvpvideo.test', password: 'password123', role: 'moderator' }
];

async function createUsers() {
  console.log('Creating test users...');

  for (const user of users) {
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers.users.find(u => u.email === user.email);

    let userId;

    if (existing) {
      console.log(`User ${user.email} already exists.`);
      userId = existing.id;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role }
      });

      if (error) {
        console.error(`Error creating ${user.email}:`, error.message);
        continue;
      }
      console.log(`User ${user.email} created.`);
      userId = data.user.id;
    }

    // Assign Role (using SQL via RPC or direct insert if we had access, but here we assume the SQL script for roles works if we have the ID)
    // Since we can't easily run SQL from here without pg, we rely on the previous SQL script or we can try to use the service key to insert into user_roles if RLS allows (usually not for public).
    // But wait, `user_roles` is in `public` schema. We can insert into it using supabase client if RLS allows service role.
    
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: (await getRoleId(user.role))
      }, { onConflict: 'user_id, role_id' });

    if (roleError) {
        // If role doesn't exist, we might need to fetch it first
        console.error(`Error assigning role ${user.role} to ${user.email}:`, roleError.message);
    } else {
        console.log(`Role ${user.role} assigned to ${user.email}.`);
    }
  }
}

async function getRoleId(roleName) {
    const { data, error } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();
    
    if (error) {
        console.error(`Error fetching role ${roleName}:`, error.message);
        return null;
    }
    return data.id;
}

createUsers();
