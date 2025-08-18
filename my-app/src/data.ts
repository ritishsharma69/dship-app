import type { Product, ReviewsSummary } from './types';

export const product: Product = {
  id: 'prod_head_massager_1',
  title: 'Electric Head & Body Massager (Rechargeable)',
  brand: 'Khushiyan',
  price: 999,
  compareAtPrice: 1899,
  images: [
    '/products/head-massager/1.jpg',
    '/products/head-massager/2.jpg',
    '/products/head-massager/3.jpg',
    '/products/head-massager/4.jpg'
  ],
  youtubeUrl: 'https://www.youtube.com/watch?v=RAKbZazdgqk',
  bullets: [
    'Instant relaxation for head, neck and shoulders',
    'Improves blood circulation — relieves stress and headaches',
    'Deep scalp massage helps reduce hair fall and promotes growth',
    'Soft, flexible massage nodes — comfortable for all hair types',
    'Use on face, scalp, back and legs — full body relaxation',
    'Rechargeable and cordless — use anywhere, anytime'
  ],
  descriptionHeading: 'Spa-like relaxation at home',
  descriptionPoints: [
    '3D kneading action targets pressure points',
    'Daily 10 minutes helps improve sleep quality',
    'Lightweight and ergonomic design for easy grip',
  ],
  sku: 'HEAD-MASSAGER-RECHARGEABLE',
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

