import type { Product, ReviewsSummary } from './types';

export const product: Product = {
  id: 'prod_1',
  title: 'Adivasi Neelambari Herbal Hair Oil (200ml)',
  brand: 'Bio Health India',
  price: 699,
  compareAtPrice: 1299,
  images: [
    '/products/adivasi/adivasi-1.png',
    '/products/adivasi/adivasi-2.png',
    '/products/adivasi/adivasi-3.png',
    '/products/adivasi/adivasi-4.png'
  ],
  video: undefined,
  bullets: [
    'Reduces hair fall and breakage',
    'Promotes new hair growth',
    'Herbal formulation with natural oils',
    'Deep scalp nourishment',
    'Suitable for all hair types'
  ],
  sku: 'ADIVASI-200ML',
  inventoryStatus: 'IN_STOCK'
};

export const reviews: ReviewsSummary = {
  ratingAvg: 4.6,
  ratingCount: 1287,
  testimonials: [
    { author: 'Aman K.', quote: 'Within 2 weeks hair fall kam ho gaya. Scalp fresh aur nourished lagta hai.', avatar: 'https://i.pravatar.cc/100?img=14' },
    { author: 'Ritika S.', quote: 'Dandruff almost gayab! Baal zyada soft aur shiny ho gaye.', avatar: 'https://i.pravatar.cc/100?img=5' },
    { author: 'Neha P.', quote: 'Raat ko lagao, subah wash karo — growth me naya baby hair dikh raha hai. Totally worth it!', avatar: 'https://i.pravatar.cc/100?img=21' }
  ]
};

