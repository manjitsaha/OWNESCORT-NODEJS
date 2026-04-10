const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function testWallet() {
  try {
    // 1. Connect to DB to get a user
    await mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.1', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    
    // Load User model
    require('./models/User');
    const User = mongoose.model('User');
    
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database for testing.');
      process.exit(1);
    }
    
    console.log(`Testing with user: ${user.email || user.phoneNumber} (${user._id})`);
    
    // 2. Generate Token
    const token = jwt.sign({ id: user._id }, 'ownescort123', {
      expiresIn: '30d',
    });
    
    // Configure headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const API_URL = 'http://localhost:5001/api/wallet';
    
    // 3. Test GET Balance
    console.log('\n--- GET Balance ---');
    const resGet = await fetch(API_URL, { headers });
    const getBalanceData = await resGet.json();
    console.log('GET Balance Response:', getBalanceData);
    
    // 4. Test Deposit
    console.log('\n--- POST Deposit ---');
    const resDep = await fetch(`${API_URL}/deposit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 150 })
    });
    const depositData = await resDep.json();
    console.log('POST Deposit Response:', depositData);
    
    // 5. Test Withdraw (Success)
    console.log('\n--- POST Withdraw (Success) ---');
    const resWith1 = await fetch(`${API_URL}/withdraw`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 50 })
    });
    const withdrawData1 = await resWith1.json();
    console.log('POST Withdraw Response:', withdrawData1);
    
    // 6. Test Withdraw (Fail - Insufficient Funds)
    console.log('\n--- POST Withdraw (Fail) ---');
    const resWith2 = await fetch(`${API_URL}/withdraw`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 100000 }) // likely fails
    });
    const withdrawData2 = await resWith2.json();
    console.log('POST Withdraw (Fail) Response:', withdrawData2);
    
    mongoose.disconnect();

  } catch(e) {
    console.error('Error during testing:', e);
    process.exit(1);
  }
}

testWallet();
