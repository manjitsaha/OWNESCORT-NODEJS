const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const connectDB = require('./config/db');
const firebaseAdmin = require('./config/firebase');
const authRoutes = require('./routes/authRoutes');
const escortRoutes = require('./routes/escortRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const messageRoutes = require('./routes/messageRoutes');
const desireRoutes = require('./routes/desireRoutes');
const walletRoutes = require('./routes/walletRoutes');
const reelRoutes = require('./routes/reelsRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Message = require('./models/Message');
const Booking = require('./models/Booking');
const swaggerDocs = require("./swagger");
const path = require('path');



connectDB(); // Connect to MongoDB

const app = express();
const server = http.createServer(app);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development. Restrict in production for security.
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket.IO Authentication Middleware
// This middleware will run for every new WebSocket connection.
io.use(async (socket, next) => {
  // The client is expected to send the JWT in the 'auth' object during handshake.
  // Example client-side connection:
  // const socket = io('http://localhost:5000', {
  //   auth: {
  //     token: 'YOUR_JWT_TOKEN_HERE'
  //   }
  // });
  const token = socket.handshake.auth.token;

  if (!token) {
    // If no token is provided, reject the connection
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    // Verify the token using your JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user based on the decoded ID and attach the user object to the socket
    const user = await User.findById(decoded.id).select('-password'); // Exclude password for security

    if (!user) {
      // If user not found, reject the connection
      return next(new Error('Authentication error: User not found.'));
    }

    // Attach the authenticated user to the socket object.
    // This makes `socket.user` available in all subsequent Socket.IO event handlers for this connection.
    socket.user = user;
    next(); // Proceed with the connection
  } catch (error) {
    // If token verification fails (e.g., invalid, expired), reject the connection
    console.error('Socket.IO authentication failed:', error.message);
    return next(new Error('Authentication error: Invalid token.'));
  }
});


// Security Middlewares for Express
app.use(express.json({ limit: '10kb' }));
app.use(helmet());
app.use(cors());

// Rate Limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many login/signup attempts from this IP, please try again after 15 minutes',
});
app.use('/api/auth', authLimiter);

// Routes for REST API
app.use('/api/auth', authRoutes);
app.use('/api/escorts', escortRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/desires', desireRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reels', reelRoutes);

// Socket.IO Connection and Event Handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (User: ${socket.user.email}, Role: ${socket.user.role})`);

  // Join a booking-specific chat room
  socket.on('joinRoom', async (bookingId) => {
    try {
      if (!bookingId || typeof bookingId !== 'string') {
        throw new Error('Invalid bookingId provided for joinRoom.');
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit('roomError', 'Booking not found.');
        return;
      }

      // Ensure user is authorized to join this booking's room
      const isCustomer = booking.customer.toString() === socket.user._id.toString();
      const isEscort = booking.escort.toString() === socket.user._id.toString();
      const isBrokerOrAdmin = socket.user.role === 'Broker' || socket.user.role === 'Admin';

      if (!isCustomer && !isEscort && !isBrokerOrAdmin) {
        socket.emit('roomError', 'Not authorized to join this chat room.');
        return;
      }

      // Leave any previously joined rooms (optional, but good for single-room chats)
      // Object.keys(socket.rooms).forEach(room => {
      //   if (room !== socket.id) socket.leave(room);
      // });

      socket.join(bookingId);
      console.log(`${socket.user.email} joined room: ${bookingId}`);
      socket.emit('joinedRoom', bookingId); // Confirm successful room join to client

    } catch (error) {
      console.error(`Error joining room ${bookingId}: ${error.message}`);
      socket.emit('roomError', `Failed to join room: ${error.message}`);
    }
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ bookingId, content }) => {
    try {
      if (!bookingId || !content || typeof content !== 'string' || content.trim() === '') {
        throw new Error('Invalid message content or bookingId.');
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit('messageError', 'Booking not found for this chat.');
        return;
      }

      // Re-verify authorization for sending message in this booking's chat
      const isCustomer = booking.customer.toString() === socket.user._id.toString();
      const isEscort = booking.escort.toString() === socket.user._id.toString();
      const isBrokerOrAdmin = socket.user.role === 'Broker' || socket.user.role === 'Admin';

      if (!isCustomer && !isEscort && !isBrokerOrAdmin) {
        socket.emit('messageError', 'Not authorized to send messages in this chat.');
        return;
      }

      const message = await Message.create({
        sender: socket.user._id,
        booking: bookingId,
        content: content.trim(),
        readBy: [socket.user._id], // Sender automatically reads their own message
      });

      // Populate sender details for the emitted message
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name role email'); // Populate only essential sender info

      // Emit message to all clients in the room (including sender)
      io.to(bookingId).emit('newMessage', {
        _id: populatedMessage._id,
        sender: {
          _id: populatedMessage.sender._id,
          name: populatedMessage.sender.name,
          role: populatedMessage.sender.role,
        },
        booking: populatedMessage.booking,
        content: populatedMessage.content,
        createdAt: populatedMessage.createdAt,
        readBy: populatedMessage.readBy,
      });

      console.log(`Message sent in room ${bookingId} by ${socket.user.name}: ${content}`);

    } catch (error) {
      console.error(`Error sending message in room ${bookingId}: ${error.message}`);
      socket.emit('messageError', `Failed to send message: ${error.message}`);
    }
  });

  // Handle read receipts
  socket.on('markAsRead', async ({ messageId, bookingId }) => {
    try {
      if (!messageId || !bookingId) {
        throw new Error('Message ID and Booking ID are required to mark as read.');
      }

      const message = await Message.findById(messageId);
      if (!message || message.booking.toString() !== bookingId) {
        socket.emit('readError', 'Message not found for this booking.');
        return;
      }

      // Re-verify authorization to mark message as read
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit('readError', 'Booking not found for this message.');
        return;
      }

      const isCustomer = booking.customer.toString() === socket.user._id.toString();
      const isEscort = booking.escort.toString() === socket.user._id.toString();
      const isBrokerOrAdmin = socket.user.role === 'Broker' || socket.user.role === 'Admin';

      if (!isCustomer && !isEscort && !isBrokerOrAdmin) {
        socket.emit('readError', 'Not authorized to mark this message as read.');
        return;
      }

      // Add user to readBy array if not already present
      // Using .equals() for proper ObjectId comparison
      if (!message.readBy.some(id => id.equals(socket.user._id))) {
        message.readBy.push(socket.user._id);
        await message.save();

        // Emit an update to the room about the read receipt
        io.to(bookingId).emit('messageRead', { messageId, readerId: socket.user._id });
        console.log(`${socket.user.email} marked message ${messageId} as read.`);
      }

    } catch (error) {
      console.error(`Error marking message ${messageId} as read: ${error.message}`);
      socket.emit('readError', `Failed to mark message as read: ${error.message}`);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} (User: ${socket.user ? socket.user.email : 'N/A'})`);
  });
});


// Catch 404 and forward to error handler (for REST API)
app.use(notFound);

// Error handling middleware (should be last for REST API)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
swaggerDocs(app, PORT);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});