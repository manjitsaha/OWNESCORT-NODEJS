// This file is prepared for future mobile OTP implementation using Twilio.
// It is not actively used in the current email-OTP login flow.

const twilio = require('twilio');

// Ensure these environment variables are set if you plan to use Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Only initialize client if credentials are available
let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials not fully set. SMS sending will be disabled.');
}


const sendSms = async ({ to, body }) => {
  if (!client) {
    console.error('Twilio client not initialized. Cannot send SMS.');
    throw new Error('SMS service unavailable.');
  }

  if (!to || !body) {
    throw new Error('Recipient number and message body are required for SMS.');
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to, // This is the recipient's phone number
    });
    console.log(`SMS sent successfully to ${to}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`Error sending SMS to ${to}: ${error.message}`);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = sendSms;