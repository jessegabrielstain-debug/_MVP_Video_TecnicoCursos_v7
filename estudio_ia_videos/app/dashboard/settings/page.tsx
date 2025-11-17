/**
 * User Settings Page
 * 
 * User settings and preferences page
 * 
 * @page
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/services';
import { redirect } from 'next/navigation';
import { UserSettings } from '@/components/user/user-settings';

export const metadata: Metadata = {
  title: 'Settings | Estúdio IA Videos',
  description: 'Manage your account settings and preferences',
};

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserSettings userId={user.id} />
      </div>
    </div>
  );
}
