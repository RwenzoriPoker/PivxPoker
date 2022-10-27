const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const Long = mongoose.Schema.Types.Long;

const cashGameSchema = new Schema({
  name: { type: String, required: true },
  blinds: { type: Number, required: true },
  minChips: { type: Long, required: true },
  maxChips: { type: Long, required: true },
  seats: { type: Number, required: true },
  serverSeed:{type: String, required: true },
  created: { type: Date, default: Date.now },
  closed: { type: Boolean, default: false }
});

cashGameSchema.set('toJSON', { getters: true });

cashGameSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  delete obj.__v;
  return obj;
};



module.exports = mongoose.model('cashGame', cashGameSchema);
