const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const TicketSchema = new Schema({    
  sender:{
    type: mongoose.ObjectId,
    ref:'user',
    required:true,
    index:true
  },
  content:{
    type:String   
  },  
  status:{
    type:Boolean,
    default:false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = Feedback = mongoose.model("ticket", TicketSchema);
