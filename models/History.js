const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
  type: { type: String, enum: ['in', 'out'], required: true }, // 'in' for items added, 'out' for items removed
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);
