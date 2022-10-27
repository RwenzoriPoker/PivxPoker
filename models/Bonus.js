const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const Long = mongoose.Schema.Types.Long;
// Create Schema
const BonusSchema = new Schema({
  table:{
    type:mongoose.ObjectId
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  amount:{
    type:Long
  },
  user:{
    type:String
  },
  game:{
      type:String,
      enum:["CashGame","Sit&Go"]
  }
});

module.exports =BonusSchema;
