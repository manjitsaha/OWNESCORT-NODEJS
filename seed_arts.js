const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Art = require('./models/Art');

const MONGO_URI = process.env.MONGO_URI;
const ESCORT_ID = '69d21b066405980b25b4ae50';

const artEntries = [
  { title: 'Kissing', art: 'art_1.jpg' },
  { title: 'Hugging', art: 'art_2.jpg' },
  { title: 'Talking', art: 'art_3.jpg' },
  { title: 'Dancing', art: 'art_4.jpg' },
  { title: 'Cuddling', art: 'art_5.jpg' },
  { title: 'Walking', art: 'art_6.jpg' },
  { title: 'Dining', art: 'art_7.jpg' },
  { title: 'Laughing', art: 'art_8.jpg' },
  { title: 'Travelling', art: 'art_9.jpg' },
  { title: 'Dreaming', art: 'art_10.jpg' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const docs = artEntries.map((entry) => ({
      escortId: new mongoose.Types.ObjectId(ESCORT_ID),
      title: entry.title,
      art: entry.art,
    }));

    const result = await Art.insertMany(docs);
    console.log(`Successfully inserted ${result.length} art entries:`);
    result.forEach((doc) => {
      console.log(`  _id: ${doc._id} | title: ${doc.title} | art: ${doc.art}`);
    });

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
