import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  // If an admin already exists, do not let anyone access this page.
  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) {
    redirect('/admin/login');
  }

  return <SetupForm />;
}
