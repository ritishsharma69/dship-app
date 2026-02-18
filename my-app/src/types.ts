export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  descriptionHeading?: string;
  descriptionPoints?: string[];
  brand?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  video?: string; // URL to mp4/webm
  youtubeUrl?: string; // optional YouTube URL for gallery (embed as 2nd item)
  bullets: string[];
  sku: string;
  inventoryStatus: InventoryStatus;
  testimonials?: Testimonial[]; // optional product testimonials
}

export interface Testimonial {
  author: string;
  quote: string;
  rating?: number; // 1..5
  // avatar?: string; // no images per request
}

export interface ReviewsSummary {
  ratingAvg: number; // 0..5
  ratingCount: number;
  testimonials: Testimonial[];
}

