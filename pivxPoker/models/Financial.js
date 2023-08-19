const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const Long = mongoose.Schema.Types.Long;
// Create Schema
const FinancialSchema = new Schema({
  type:{
    type:String,
    enum:["Recharge","Withdrawal","Reward","Game","Bonus","Sit&Go"]
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  amount:{
    type:Long
  },
  details:{
    type:String
  }
});

module.exports =FinancialSchema;
