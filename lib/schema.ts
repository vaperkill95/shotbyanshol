import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  type: text('type').notNull().default('photo'),
  caption: text('caption').notNull().default(''),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  eventType: text('event_type'),
  eventDate: text('event_date'),
  message: text('message').notNull().default(''),
  status: text('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  siteName: text('site_name').notNull().default('ShotByAnshol'),
  bio: text('bio').notNull().default(''),
  contactEmail: text('contact_email').notNull().default(''),
  bookingStatus: text('booking_status')
    .notNull()
    .default('Currently booking 2026'),
});
