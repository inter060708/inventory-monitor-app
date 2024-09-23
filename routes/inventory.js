// routes/inventory.js

const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const History = require('../models/History');

// Home Route - Redirect to /inventory
router.get('/', (req, res) => {
  res.redirect('/inventory');
});

// Display All Inventory Items
router.get('/inventory', async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.render('index', { items: items });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Show Form to Add New Inventory Item
router.get('/inventory/new', (req, res) => {
  res.render('new');
});

// Create a New Inventory Item
router.post('/inventory', async (req, res) => {
  const { name, quantity, location, description } = req.body;
  const newItem = new Inventory({
    name,
    quantity,
    location,
    description,
  });

  try {
    await newItem.save();

    // Create new history log
    const historyEntry = new History({
      itemId: newItem._id,
      type: 'in',
      quantity: newItem.quantity,
      date: Date.now()
    });

    await historyEntry.save();

    res.redirect('/inventory');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Route to view the in/out history of a specific item
router.get('/inventory/:id', async (req, res) => {
  try {
    // Find the item by ID
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).send('Item not found');
    }

    // Find the in/out history related to this item
    const history = await History.find({ itemId: req.params.id }).sort({ date: -1 });

    // Render the item details and its history
    res.render('item-history', { item, history });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Show Form to Edit an Inventory Item
router.get('/inventory/:id/edit', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).send('Inventory Item not found');
    }
    res.render('edit', { item: item });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Update an Inventory Item
router.put('/inventory/:id', async (req, res) => {
  const { name, quantity, location, description } = req.body;
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).send('Inventory Item not found');
    }

    const quantityDiff = quantity - item.quantity;

    if (quantityDiff !== 0) {
      const inOrOut = quantityDiff > 0 ? 'in' : 'out';

      item.name = name;
      item.quantity = quantity;
      item.location = location;
      item.description = description;

      await item.save();

      const historyEntry = new History({
        itemId: item._id,
        type: inOrOut,
        quantity: Math.abs(quantityDiff),
        date: Date.now()
      });

      await historyEntry.save();
    }

    res.redirect('/inventory');
  } catch (err) {
    res.status(400).send(err.message);
  }
});


// Delete an Inventory Item using findByIdAndDelete
router.delete('/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).send('Inventory Item not found');
    }
    res.redirect('/inventory');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Route to show paginated monthly item in/out history, grouped by day
router.get('/history/monthly', async (req, res) => {
  try {
    const { month, year, page = 1 } = req.query; // Get the month, year, and page number from the query parameters
    const limit = 5; // Number of days to show per page

    // Create start and end dates for the specified month
    const startDate = new Date(year, month - 1, 1); // Start of the month
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // End of the month

    // Find all history records within the specified month
    const allHistory = await History.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('itemId').sort({ date: -1 }); // Sort by date (oldest to newest)

    // Group the records by day
    const historyByDay = groupByDay(allHistory);

    // Calculate pagination variables
    const totalDays = Object.keys(historyByDay).length;
    const totalPages = Math.ceil(totalDays / limit);
    const paginatedDays = Object.keys(historyByDay).slice((page - 1) * limit, page * limit);

    const paginatedHistory = paginatedDays.map(day => ({
      day,
      records: historyByDay[day]
    }));

    res.render('monthlyHistory', {
      paginatedHistory,
      currentPage: page,
      totalPages,
      month,
      year
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Helper function to group history records by day
function groupByDay(history) {
  return history.reduce((grouped, record) => {
    const day = new Date(record.date).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(record);
    return grouped;
  }, {});
}


module.exports = router;
