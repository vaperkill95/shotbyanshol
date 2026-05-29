import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/schema';
import { getResend, FROM_ADDRESS } from '@/lib/email';

export const runtime = 'nodejs';

// Tiny in-memory rate limiter to mitigate spam from a single IP.
// (For real abuse protection, consider an upstream service like Cloudflare Turnstile.)
const requestLog = new Map<string, number[]>();
const MAX_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = (requestLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (history.length >= MAX_PER_HOUR) return true;
  history.push(now);
  requestLog.set(ip, history);
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '';
  const eventType =
    typeof body.eventType === 'string' ? body.eventType.trim().slice(0, 80) : '';
  const eventDate =
    typeof body.eventDate === 'string' ? body.eventDate.trim().slice(0, 50) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 3000) : '';

  // Honeypot — bots fill hidden fields, real users don't.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ success: true }); // pretend success
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Name, email, and message are required.' },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }

  // Save first — even if email sending fails, the booking is preserved.
  try {
    await db.insert(bookings).values({
      name,
      email,
      eventType: eventType || null,
      eventDate: eventDate || null,
      message,
      status: 'new',
    });
  } catch (err) {
    console.error('Booking insert failed:', err);
    return NextResponse.json({ error: 'Could not save your message.' }, { status: 500 });
  }

  // Best-effort notification email.
  const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;
  if (notifyTo) {
    try {
      const resend = getResend();
      const subject = `New booking request from ${name}`;
      const html = `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="margin:0 0 16px;font-size:20px">New booking request</h2>
          <table style="width:100%;border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">
            <tr><td style="padding:6px 0;color:#777;width:120px">From</td><td>${escapeHtml(name)}</td></tr>
            <tr><td style="padding:6px 0;color:#777">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
            ${eventType ? `<tr><td style="padding:6px 0;color:#777">Event type</td><td>${escapeHtml(eventType)}</td></tr>` : ''}
            ${eventDate ? `<tr><td style="padding:6px 0;color:#777">Date</td><td>${escapeHtml(eventDate)}</td></tr>` : ''}
          </table>
          <div style="margin-top:18px;padding:14px;background:#f6f3ee;border-left:3px solid #c97a3f;white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px;line-height:1.55">${escapeHtml(message)}</div>
          <p style="margin-top:18px;color:#777;font-size:12px;font-family:system-ui,sans-serif">
            Reply directly to this email to respond. Full booking is also viewable in your admin dashboard.
          </p>
        </div>
      `.trim();

      await resend.emails.send({
        from: FROM_ADDRESS,
        to: notifyTo,
        replyTo: email, // Anshol can just hit reply.
        subject,
        html,
      });
    } catch (err) {
      // Don't fail the user-facing request just because the email didn't send.
      // The booking is saved and visible in admin regardless.
      console.error('Resend email failed:', err);
    }
  }

  return NextResponse.json({ success: true });
}

