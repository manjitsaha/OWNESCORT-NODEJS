const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Art = require('./models/Art');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

// All 10 available art images with titles
const allArts = [
  { title: 'Kissing',    art: 'art_1.jpg' },
  { title: 'Hugging',    art: 'art_2.jpg' },
  { title: 'Talking',    art: 'art_3.jpg' },
  { title: 'Dancing',    art: 'art_4.jpg' },
  { title: 'Cuddling',   art: 'art_5.jpg' },
  { title: 'Walking',    art: 'art_6.jpg' },
  { title: 'Dining',     art: 'art_7.jpg' },
  { title: 'Laughing',   art: 'art_8.jpg' },
  { title: 'Travelling', art: 'art_9.jpg' },
  { title: 'Dreaming',   art: 'art_10.jpg' },
];

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all 8 seeded escorts by email pattern
    const escorts = await User.find({ role: 'Escort' }).select('_id name');
    if (!escorts.length) {
      console.error('❌ No escorts found in DB. Run seed_escorts.js first.');
      process.exit(1);
    }

    console.log(`Found ${escorts.length} escort(s). Inserting arts...\n`);

    let totalInserted = 0;

    for (const escort of escorts) {
      // Random count between 3 and 10 (inclusive), never more than available arts
      const count = randomInt(3, allArts.length);
      const chosen = shuffle(allArts).slice(0, count);

      const docs = chosen.map((entry) => ({
        escortId: escort._id,
        title: entry.title,
        art: entry.art,
      }));

      const result = await Art.insertMany(docs);
      totalInserted += result.length;

      const titles = result.map((r) => r.title).join(', ');
      console.log(`✅ ${escort.name} (${escort._id}) — ${result.length} arts: [${titles}]`);
    }

    console.log(`\n🎉 Done! Total art entries inserted: ${totalInserted}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
