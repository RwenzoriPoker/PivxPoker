const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const Long = mongoose.Schema.Types.Long;
// Create Schema
const RechargeSchema = new Schema({  
  user:{
    type: mongoose.ObjectId,
    required:true,
    index:true
  },
  amount:{
    type:Long,
    index:true
  },
  txid:{
    type:String,
    index:true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  shown:{
    type:Boolean,
    default:false
  },
  confirmations:{
    type:Number,
    default:0,
    index:true
  }
  
});

module.exports = Recharge = mongoose.model("recharge", RechargeSchema);
