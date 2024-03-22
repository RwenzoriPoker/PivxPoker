const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const Long = mongoose.Schema.Types.Long;
const sitGameSchema = new Schema({
  name: { type: String, required: true },
  blindsSchedule: { type: Number, required: true },
  stack: { type: Long, required: true },
  first: { type: Long },
  second: { type: Long },
  third: { type: Long },
  buyIn:{type: Long},
  seats: { type: Number, required: true },
  serverSeed:{type: String, required: true },
  created: { type: Date, default: Date.now },
  closed: { type: Boolean, default: false }
});

sitGameSchema.set('toJSON', { getters: true });

sitGameSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  delete obj.__v;
  return obj;
};



module.exports = mongoose.model('sitGame', sitGameSchema);
