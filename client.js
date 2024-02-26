const express = require('express');
const mongoose = require('mongoose');
const stripe = require('stripe')('your_stripe_secret_key');

const app = express();
app.use(express.json());

// MongoDB connection setup (replace 'your_database_url' with your MongoDB connection string)
mongoose.connect('your_database_url', { useNewUrlParser: true, useUnifiedTopology: true });

// Define MongoDB Order Schema
const orderSchema = new mongoose.Schema({
  invoiceId: String,
  userId: String,
  paymentDetails: {
    cardNumber: String,
    // Add other payment details as needed
  },
});

const Order = mongoose.model('Order', orderSchema);

// Stripe payment route
app.post('/create-payment-intent', async (req, res) => {
  const { userId, cardNumber, amount } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
  });

  // Store the order details in the database
  const order = new Order({
    invoiceId: paymentIntent.id,
    userId,
    paymentDetails: {
      cardNumber,
      // Add other payment details as needed
    },
  });
  await order.save();

  res.json({ clientSecret: paymentIntent.client_secret });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
