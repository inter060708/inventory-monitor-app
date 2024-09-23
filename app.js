// app.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const inventoryRoutes = require('./routes/inventory');
const mongoURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.oh7l6.mongodb.net/`;
// const mongoURI = 'mongodb+srv://edwinr0661:JCLXLa4JzneN4W0M@cluster0.oh7l6.mongodb.net/';
// const mongoURI = process.env.MONGODB_URI

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data
app.use(express.json()); // To parse JSON data
app.use(methodOverride('_method')); // To support PUT and DELETE methods via forms
app.use(express.static(path.join(__dirname, 'public'))); // To serve static files

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Root Route
app.use('/', inventoryRoutes);

// Root Route - Redirect handled in inventory routes
// app.get('/', (req, res) => {
//   res.send('Welcome to the Warehouse Inventory Monitoring App!');
// });
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
