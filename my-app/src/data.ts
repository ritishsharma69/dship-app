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
    { author: 'Aman K.', quote: 'Within 2 weeks hair fall kam ho gaya. Scalp fresh aur nourished lagta hai.', rating: 5 },
    { author: 'Ritika S.', quote: 'Dandruff almost g̀ayab! Baal zyada soft aur shiny ho gaye.', rating: 5 },
    { author: 'Neha P.', quote: 'Raat ko lagao, subah wash karo — growth me naya baby hair dikh raha hai. Totally worth it!', rating: 5 },
    { author: 'Vineet K.', quote: 'Value for money! Use karne me bahut comfortable aur daily relaxation milta hai.', rating: 4 },
    { author: 'Shreya G.', quote: 'Mom ke liye liya tha, migraine me kaafi relief milta hai. Build quality bhi acchi hai.', rating: 5 },
    { author: 'Nimesh', quote: 'Grip perfect hai, anti-slip. Price ke hisab se best. Packing bhi proper thi.', rating: 4 },
    { author: 'Tapan', quote: 'I am very happy. Scalp massage ke baad sleep better hoti hai.', rating: 5 },
    { author: 'Sanjeev', quote: 'Fitting awesome. Wife ko gift kiya, unhe bhi pasand aaya. Value for money.', rating: 5 },
    { author: 'Roni', quote: 'Decent for this price. Colour matches the photos. Comfort good for daily use.', rating: 4 },
    { author: 'Azim', quote: '1 month use ke baad review: Nice product, you can go for it.', rating: 4 },
    { author: 'Shaziya', quote: 'Late delivery ke wajah se 1 star kam, par product bohot accha hai.', rating: 4 },
    { author: 'Naved', quote: '3 months se use kar raha hu, ab tak koi issue nahi. Highly recommended.', rating: 5 },
    { author: 'Sachin', quote: 'Value for money. Comfortable as well.', rating: 4 },
    { author: 'Pooja', quote: 'Hair wash se pehle 5-10 min use karti hu, baal smooth lagte hain.', rating: 5 },
    { author: 'Rekha', quote: 'Ghar pe spa jaisa feel! Rechargeable hona sabse bada plus hai.', rating: 5 },
    { author: 'Aarti', quote: 'Compact aur lightweight, travel me carry karna easy.', rating: 5 },
    { author: 'Mahesh', quote: 'Back pain me bhi kaafi relief mila. Battery backup bhi theek.', rating: 4 },
    { author: 'Kunal', quote: 'Design ergonomic, grip solid. Packaging safe thi.', rating: 5 },
    { author: 'Sneha', quote: 'Scalp me blood circulation feel hota hai, stress kam hota hai.', rating: 5 },
    { author: 'Rahul', quote: 'Daily 10 min sufficient. Build aur performance dono achche.', rating: 5 }
  ]
};



// Names and cities for live sales popup
export const liveNames: string[] = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Reyansh','Muhammad','Sai','Ayaan','Krishna',
  'Ishaan','Rudra','Kabir','Rohan','Dhruv','Atharv','Arnav','Param','Yuvraj','Harshit',
  'Ananya','Aarohi','Diya','Myra','Meera','Anika','Sara','Kiara','Aadhya','Saanvi',
  'Lavanya','Ira','Navya','Aanya','Advika','Ishita','Trisha','Niharika','Ria','Prisha',
  'Karan','Manish','Ritesh','Sagar','Rahul','Ravi','Sunil','Vikas','Sandeep','Amit',
  'Pooja','Neha','Ritika','Shreya','Muskan','Prerna','Kritika','Roshni','Payal','Sneha',
  'Zoya','Farhan','Imran','Faizan','Aqsa','Ayesha','Yasir','Fiza','Arham','Nida',
  'Harpreet','Gurpreet','Simran','Jaspreet','Amrit','Navjot','Manpreet','Ravneet','Parminder','Kamal',
  'Shivam','Akash','Ankita','Bhavesh','Chirag','Deepak','Esha','Gauri','Hemant','Isha',
  'Jay','Kajal','Lakshay','Madhav','Nisha','Ojas','Prachi','Rachit','Sana','Tanvi',
  'Yash','Rhea','Tanya','Pratik','Anushka','Dev','Tarun','Naman','Ibrahim','Rehan',
  'Kabya','Aishwarya','Mitali','Sujoy','Pallavi','Hrithik','Siddharth','Irfan','Sameer','Anubhav',
  'Bhumi','Mehak','Dhriti','Vedant','Harsh','Hardik','Jatin','Keshav','Om','Parth',
  'Ritvik','Anmol','Tushar','Utkarsh','Yogesh','Zubair','Zainab','Wasim','Tanay','Pranjal',
  'Sourav','Rupali','Mehul','Kinjal','Hetal','Devanshi','Palak','Naman','Vibhor','Jahnvi',
  'Aman','Harsha','Charu','Chaitanya','Divyansh','Ekta','Falak','Girish','Hansika','Ipsita'
]

export const liveCities: string[] = [
  'Patiala','Palampur','Palampur','Ludhiana','Amritsar','Jalandhar','Bathinda','Moga','Mohali','Chandigarh',
  'Delhi','Gurugram','Noida','Faridabad','Ghaziabad','Jaipur','Jodhpur','Udaipur','Kota','Ajmer',
  'Mumbai','Thane','Pune','Nagpur','Nashik','Aurangabad','Indore','Bhopal','Gwalior','Raipur',
  'Lucknow','Kanpur','Varanasi','Prayagraj','Agra','Meerut','Bareilly','Gorakhpur','Aligarh','Moradabad',
  'Kolkata','Howrah','Asansol','Siliguri','Durgapur','Patna','Gaya','Muzaffarpur','Ranchi','Jamshedpur',
  'Hyderabad','Warangal','Nizamabad','Vijayawada','Visakhapatnam','Guntur','Tirupati','Bengaluru','Mysuru','Mangaluru',
  'Chennai','Coimbatore','Madurai','Trichy','Salem','Erode','Kochi','Thiruvananthapuram','Kozhikode','Kollam',
  'Surat','Ahmedabad','Rajkot','Bhavnagar','Jamnagar','Vadodara','Porbandar','Morbi','Junagadh','Gandhinagar',
  'Dehradun','Haridwar','Rishikesh','Haldwani','Shimla','Solan','Hamirpur','Una','Kangra','Dharamshala',
  'Srinagar','Jammu','Leh','Udhampur','Imphal','Aizawl','Shillong','Gangtok','Itanagar','Kohima',
  'Bilaspur','Rewa','Satna','Guna','Hoshangabad','Ratlam','Dewas','Ujjain','Mandya','Belagavi',
  'Hubballi','Davanagere','Ballari','Tumakuru','Hassan','Hampi','Rohtak','Hisar','Panipat','Sonipat',
  'Karnal','Panchkula','Ambala','Sirsa','Yamunanagar','Rewari','Fatehabad','Bhiwani','Palwal','Kurukshetra'
]
