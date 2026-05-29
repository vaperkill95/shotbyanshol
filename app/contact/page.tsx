import { getSiteSettings } from '@/lib/queries';
import ContactForm from './ContactForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contact · ShotByAnshol',
  description: 'Inquire about booking a photo or video shoot.',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return <ContactForm siteName={settings.siteName} bookingStatus={settings.bookingStatus} />;
}

