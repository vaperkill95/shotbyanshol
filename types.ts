export type MediaType = 'photo' | 'video';

export interface GalleryItem {
  id: number;
  caption: string;
  type: MediaType;
  imageUrl: string | null;
  videoUrl: string | null;
  category: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface SiteSettings {
  siteName: string;
  bio: string;
  contactEmail: string;
  bookingStatus: string;
}
