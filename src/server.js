const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// ✅ Twilio setup using Messaging Service SID
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const messagingServiceSid = process.env.TWILIO_SERVICE_SID;
const myPhone = process.env.MY_PHONE;

const client = require('twilio')(accountSid, authToken);

// ✅ Test route (optional)
app.get('/', (req, res) => {
  res.send('Backend is running.');
});

// ✅ POST /api/book
app.post('/api/book', async (req, res) => {
  const { firstName, lastName, address, phone, description } = req.body;

  const messageToClient = `Hi ${firstName}, thanks for reaching out! I’ll contact you shortly to confirm your photoshoot.`;
  const messageToYou = `📸 New Booking Request:\nName: ${firstName} ${lastName}\nPhone: ${phone}\nAddress: ${address}\nShoot: ${description}`;

  try {
    // Send message to client
    await client.messages.create({
      body: messageToClient,
      messagingServiceSid: messagingServiceSid,
      to: phone,
    });

    // Send message to photographer (you)
    await client.messages.create({
      body: messageToYou,
      messagingServiceSid: messagingServiceSid,
      to: myPhone,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Start server
app.listen(5000, () => console.log('Server running on port 5000'));
