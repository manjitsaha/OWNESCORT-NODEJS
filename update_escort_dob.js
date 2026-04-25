const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

// Convert from any recognized format → dd-MM-yyyy
function toDDMMYYYY(dob) {
  if (!dob) return null;

  // Already in dd-MM-yyyy?
  if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) return dob;

  // yyyy-MM-dd → dd-MM-yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const [y, m, d] = dob.split('-');
    return `${d}-${m}-${y}`;
  }

  // Fallback: try native Date parsing
  const date = new Date(dob);
  if (!isNaN(date)) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return dob; // Return as-is if unparseable
}

async function update() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const escorts = await User.find({ role: 'Escort' }).select('_id name dob');

    if (!escorts.length) {
      console.log('⚠️  No escorts found.');
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;

    for (const escort of escorts) {
      const newDob = toDDMMYYYY(escort.dob);

      if (!newDob || newDob === escort.dob) {
        console.log(`⏭  ${escort.name} — already correct or no DOB: "${escort.dob}"`);
        skipped++;
        continue;
      }

      await User.updateOne({ _id: escort._id }, { $set: { dob: newDob } });
      console.log(`✅ ${escort.name} — "${escort.dob}" → "${newDob}"`);
      updated++;
    }

    console.log(`\n🎉 Done! Updated: ${updated} | Skipped: ${skipped}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Update failed:', err);
    process.exit(1);
  }
}

update();
