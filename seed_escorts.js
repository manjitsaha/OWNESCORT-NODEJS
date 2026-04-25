const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

// ─── 8 Escort Profiles ───────────────────────────────────────────────────────
// Photos are referenced as filenames served from /uploads/ directory.
// All images have been copied to the uploads/ folder.

const escortProfiles = [
  {
    name: 'Sophia Rosé',
    email: 'sophia.rose@ownescort.com',
    phoneNumber: '+919800000001',
    role: 'Escort',
    isAvailable: true,
    bio: 'Charming, witty, and endlessly warm — I make every moment feel like the most natural thing in the world. Whether it\'s a candlelit dinner or a quiet evening in, I bring grace and laughter wherever I go.',
    dob: '1997-03-14',
    height: '5\'6"',
    weight: '55 kg',
    breast: '34B',
    waist: '24"',
    hips: '36"',
    hourlyRate: 150,
    dailyRate: 1200,
    averageRating: 4.8,
    numReviews: 42,
    internalReview: 5,
    lateNightStatus: 1,
    specialServices: [
      { name: 'Dinner Date', price: 200 },
      { name: 'City Tour', price: 180 },
      { name: 'VIP Event', price: 350 },
    ],
    // Model1 photos: 3 images
    profilePhoto: '365cb8e17e3e4b6f97b90c0ce94bd75f.jpg',
    profileImages: [
      '365cb8e17e3e4b6f97b90c0ce94bd75f.jpg',
      '3ec8684207342ae77fe62161e94f808c.jpg',
      '95c1090bf5698616fd37d0224ca8faca.jpg',
    ],
    location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
  },
  {
    name: 'Isabella Moon',
    email: 'isabella.moon@ownescort.com',
    phoneNumber: '+919800000002',
    role: 'Escort',
    isAvailable: true,
    bio: 'Elegance is my language and adventure is my passion. I love exploring new places and creating unforgettable memories. My bubbly personality and open heart make every encounter special.',
    dob: '1999-07-22',
    height: '5\'7"',
    weight: '52 kg',
    breast: '34C',
    waist: '25"',
    hips: '37"',
    hourlyRate: 180,
    dailyRate: 1500,
    averageRating: 4.9,
    numReviews: 67,
    internalReview: 5,
    lateNightStatus: 1,
    specialServices: [
      { name: 'Spa Day', price: 250 },
      { name: 'Private Party', price: 400 },
      { name: 'Weekend Getaway', price: 2000 },
    ],
    // Model 2 photos: 5 images
    profilePhoto: '275006d91f2b704124965aee760bd1ed.jpg',
    profileImages: [
      '275006d91f2b704124965aee760bd1ed.jpg',
      '416113b24b8ce1dcb58a80df5537df22.jpg',
      '50ebaf478df7e067c0b700757993a2ac.jpg',
      '862ba57833e16c82c3841e6d7ad0e31f.jpg',
      'dc1decaebad119421807f505661fa8bf.jpg',
    ],
    location: { type: 'Point', coordinates: [77.2090, 28.6139] }, // Delhi
  },
  {
    name: 'Natalia Voss',
    email: 'natalia.voss@ownescort.com',
    phoneNumber: '+919800000003',
    role: 'Escort',
    isAvailable: true,
    bio: 'Sophisticated yet spontaneous — I believe in deep conversations, fine wine, and making every second count. My European upbringing gives me a refined taste that I love sharing with the right company.',
    dob: '1996-11-05',
    height: '5\'8"',
    weight: '57 kg',
    breast: '36B',
    waist: '26"',
    hips: '38"',
    hourlyRate: 200,
    dailyRate: 1800,
    averageRating: 4.7,
    numReviews: 38,
    internalReview: 4,
    lateNightStatus: 1,
    specialServices: [
      { name: 'Business Dinner', price: 300 },
      { name: 'Yacht Party', price: 500 },
      { name: 'Overnight', price: 1500 },
    ],
    // Model3 photos: 3 images
    profilePhoto: '66fe8abfb037818f0efc1718bffddf6b.jpg',
    profileImages: [
      '66fe8abfb037818f0efc1718bffddf6b.jpg',
      'cb2bf20d5199bb67cf7eb829a292edc3.jpg',
      'db7a82d355b5346e96f1dcaa94c9c625.jpg',
    ],
    location: { type: 'Point', coordinates: [80.2707, 13.0827] }, // Chennai
  },
  {
    name: 'Leila Noir',
    email: 'leila.noir@ownescort.com',
    phoneNumber: '+919800000004',
    role: 'Escort',
    isAvailable: true,
    bio: 'Mysterious, magnetic, and full of surprises. I bring an air of intrigue and sensuality to everything I do. My passion for art and culture makes me a fascinating companion for any occasion.',
    dob: '1998-02-18',
    height: '5\'5"',
    weight: '50 kg',
    breast: '34B',
    waist: '23"',
    hips: '35"',
    hourlyRate: 170,
    dailyRate: 1400,
    averageRating: 4.6,
    numReviews: 55,
    internalReview: 5,
    lateNightStatus: 0,
    specialServices: [
      { name: 'Art Gallery Date', price: 220 },
      { name: 'Theatre Evening', price: 280 },
      { name: 'Cultural Tour', price: 200 },
    ],
    // Model4 photos: 3 images
    profilePhoto: '636a508e80239ce18b3eab1cf9c8d957.jpg',
    profileImages: [
      '636a508e80239ce18b3eab1cf9c8d957.jpg',
      '9f323cf0a429f94acd766868390e239f.jpg',
      'd3af8f4ede6e66018aa14945ca3f570c.jpg',
    ],
    location: { type: 'Point', coordinates: [88.3639, 22.5726] }, // Kolkata
  },
  {
    name: 'Amara Bliss',
    email: 'amara.bliss@ownescort.com',
    phoneNumber: '+919800000005',
    role: 'Escort',
    isAvailable: true,
    bio: 'Life is too short for dull moments! I am your perfect partner for adventure, laughter, and genuine connection. My infectious energy lights up any room and my warmth is something you will never forget.',
    dob: '2000-05-30',
    height: '5\'6"',
    weight: '53 kg',
    breast: '34C',
    waist: '24"',
    hips: '36"',
    hourlyRate: 160,
    dailyRate: 1300,
    averageRating: 4.9,
    numReviews: 89,
    internalReview: 5,
    lateNightStatus: 1,
    specialServices: [
      { name: 'Beach Day', price: 200 },
      { name: 'Clubbing Night', price: 350 },
      { name: 'Shopping Companion', price: 180 },
    ],
    // Model5 photos: 7 images
    profilePhoto: '134ba9556b7da19872222522db03792b.jpg',
    profileImages: [
      '134ba9556b7da19872222522db03792b.jpg',
      '44e9ce1f45ebb5ebb412929dca781564.jpg',
      '5a38abccb0e0f8753f703352970134c0.jpg',
      '6f99137fea8c5ddb908f33491a3d9f84.jpg',
      '88b1db26a29a5094b7ad518e7d9a7c84.jpg',
      'd2d2faad5ffdd1e437509541231c45cc.jpg',
      'd9e183c143525affc87e207fe8437fdf.jpg',
    ],
    location: { type: 'Point', coordinates: [73.8567, 18.5204] }, // Pune
  },
  {
    name: 'Victoria Lane',
    email: 'victoria.lane@ownescort.com',
    phoneNumber: '+919800000006',
    role: 'Escort',
    isAvailable: true,
    bio: 'Poised, playful, and deeply attentive — I have an innate ability to make people feel at ease. Whether it\'s a corporate event or a cozy evening, I adapt seamlessly and leave an impression that lasts.',
    dob: '1997-09-12',
    height: '5\'7"',
    weight: '56 kg',
    breast: '36C',
    waist: '25"',
    hips: '38"',
    hourlyRate: 190,
    dailyRate: 1600,
    averageRating: 4.8,
    numReviews: 73,
    internalReview: 5,
    lateNightStatus: 1,
    specialServices: [
      { name: 'Corporate Event', price: 400 },
      { name: 'Gala Night', price: 450 },
      { name: 'Private Dinner', price: 300 },
    ],
    // Model 6 photos: 5 images
    profilePhoto: '081e1976431fa516c8a3f01ad4a05d83.jpg',
    profileImages: [
      '081e1976431fa516c8a3f01ad4a05d83.jpg',
      '1f3031e01c4fdf9992071702cda31561.jpg',
      '1f82ae24ee8d783f8d5a1ff19e480b4d.jpg',
      'b96a672985358f9e3c540acf0d6eac56.jpg',
      'f0c8ed3dc522259f64c39077694a9d3d.jpg',
    ],
    location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
  },
  {
    name: 'Celeste Dior',
    email: 'celeste.dior@ownescort.com',
    phoneNumber: '+919800000007',
    role: 'Escort',
    isAvailable: true,
    bio: 'French-inspired, endlessly curious, and absolutely captivating. I speak the language of luxury and romance. Let me be the highlight of your evening — I promise you won\'t be disappointed.',
    dob: '1998-12-03',
    height: '5\'8"',
    weight: '54 kg',
    breast: '34B',
    waist: '24"',
    hips: '36"',
    hourlyRate: 220,
    dailyRate: 2000,
    averageRating: 4.7,
    numReviews: 51,
    internalReview: 5,
    lateNightStatus: 1,
    specialServices: [
      { name: 'Wine Tasting', price: 250 },
      { name: 'Luxury Cruise', price: 600 },
      { name: 'Photoshoot Companion', price: 350 },
    ],
    // Model 7 photos: 4 images
    profilePhoto: '4d83c638b6f9753efd071ec41c477f00.jpg',
    profileImages: [
      '4d83c638b6f9753efd071ec41c477f00.jpg',
      '5d18cefd975a78dbd5e738af4a290515.jpg',
      '7327ca61c837f5e522ad4ee69ea10b26.jpg',
      '96978816645af41cc5e13357f430db8d.jpg',
    ],
    location: { type: 'Point', coordinates: [78.4867, 17.3850] }, // Hyderabad
  },
  {
    name: 'Aurora Skye',
    email: 'aurora.skye@ownescort.com',
    phoneNumber: '+919800000008',
    role: 'Escort',
    isAvailable: true,
    bio: 'Dreamy, free-spirited, and utterly genuine. I believe the best connections are formed when two people are completely themselves. Join me for an experience that feels authentic, joyful, and refreshingly real.',
    dob: '2001-04-17',
    height: '5\'5"',
    weight: '49 kg',
    breast: '34B',
    waist: '23"',
    hips: '35"',
    hourlyRate: 155,
    dailyRate: 1250,
    averageRating: 5.0,
    numReviews: 28,
    internalReview: 5,
    lateNightStatus: 0,
    specialServices: [
      { name: 'Yoga & Wellness Day', price: 200 },
      { name: 'Hiking Adventure', price: 180 },
      { name: 'Bookshop Date', price: 120 },
    ],
    // Model8 photos: 4 images
    profilePhoto: '132c21c000e6e3c51db984632f67c5e3.jpg',
    profileImages: [
      '132c21c000e6e3c51db984632f67c5e3.jpg',
      '61e7c7069d187e27ebb64697ff5ef3de.jpg',
      '94cc9f4b64b9482e2e0d37b5d9402de6.jpg',
      'eebdff704e926b1e541b2747b5711dc8.jpg',
    ],
    location: { type: 'Point', coordinates: [77.1025, 28.7041] }, // Noida
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const profile of escortProfiles) {
      const existing = await User.findOne({ email: profile.email });
      if (existing) {
        console.log(`⚠️  Skipping ${profile.name} — already exists (${existing._id})`);
        skipped++;
        continue;
      }

      const doc = new User(profile);
      await doc.save();
      console.log(`✅ Created: ${profile.name} | _id: ${doc._id} | Photos: ${profile.profileImages.length}`);
      created++;
    }

    console.log(`\n🎉 Done! Created: ${created} escorts | Skipped: ${skipped} (already existed).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
