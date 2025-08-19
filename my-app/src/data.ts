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
    { author: 'Neha P.', quote: 'Raat ko lagao, subah wash karo — growth me naya baby hair dikh raha hai. Totally worth it!', avatar: 'https://i.pravatar.cc/100?img=21' },
    { author: 'Vineet K.', quote: 'Value for money! Use karne me bahut comfortable aur daily relaxation milta hai.', avatar: 'https://i.pravatar.cc/100?img=12' },
    { author: 'Shreya G.', quote: 'Mom ke liye liya tha, migraine me kaafi relief milta hai. Build quality bhi acchi hai.' },
    { author: 'Nimesh', quote: 'Grip perfect hai, anti-slip. Price ke hisab se best. Packing bhi proper thi.' },
    { author: 'Tapan', quote: 'I am very happy. Scalp massage ke baad sleep better hoti hai.' },
    { author: 'Sanjeev', quote: 'Fitting awesome. Wife ko gift kiya, unhe bhi pasand aaya. Value for money.' },
    { author: 'Roni', quote: 'Decent for this price. Colour matches the photos. Comfort good for daily use.' },
    { author: 'Azim', quote: '1 month use ke baad review: Nice product, you can go for it.' },
    { author: 'Shaziya', quote: 'Late delivery ke wajah se 1 star kam, par product bohot accha hai.' },
    { author: 'Naved', quote: '3 months se use kar raha hu, ab tak koi issue nahi. Highly recommended.' },
    { author: 'Sachin', quote: 'Value for money. Comfortable as well.' },
    { author: 'Pooja', quote: 'Hair wash se pehle 5-10 min use karti hu, baal smooth lagte hain.' },
    { author: 'Rekha', quote: 'Ghar pe spa jaisa feel! Rechargeable hona sabse bada plus hai.' },
    { author: 'Aarti', quote: 'Compact aur lightweight, travel me carry karna easy.' },
    { author: 'Mahesh', quote: 'Back pain me bhi kaafi relief mila. Battery backup bhi theek.' },
    { author: 'Kunal', quote: 'Design ergonomic, grip solid. Packaging safe thi.' },
    { author: 'Sneha', quote: 'Scalp me blood circulation feel hota hai, stress kam hota hai.' },
    { author: 'Rahul', quote: 'Daily 10 min sufficient. Build aur performance dono achche.' }
  ]
};

