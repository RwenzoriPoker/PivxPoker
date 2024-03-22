const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const FeedbackSchema = new Schema({    
  sender:{
    type: mongoose.ObjectId,
    ref:'user',
    required:true,
    index:true
  },
  content:{
    type:String   
  },  
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = Feedback = mongoose.model("feedback", FeedbackSchema);
