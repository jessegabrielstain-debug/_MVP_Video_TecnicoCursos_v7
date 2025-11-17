/**
 * User Profile Page
 * 
 * Complete user profile page with:
 * - Profile information and editing
 * - Statistics
 * - Activity log
 * - Tabs for organization
 * 
 * @page
 */

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/services';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/components/user/user-profile';
import { UserActivityLog } from '@/components/user/user-activity-log';

export const metadata: Metadata = {
  title: 'My Profile | Estúdio IA Videos',
  description: 'View and edit your profile information',
};

export default async function ProfilePage() {
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
        {/* Profile Section */}
        <UserProfile
          userId={user.id}
          editable={true}
          showStats={true}
          showActivity={false}
        />

        {/* Activity Section */}
        <div className="mt-8">
          <UserActivityLog
            userId={user.id}
            limit={20}
            showFilters={true}
          />
        </div>
      </div>
    </div>
  );
}
