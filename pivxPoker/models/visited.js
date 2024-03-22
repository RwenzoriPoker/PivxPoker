const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const VisitedSchema = new Schema({
  user:{
    type: mongoose.ObjectId,
    ref:"user",
    required:true,
    index:true
  },  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
VisitedSchema.set('toJSON', { getters: true });
VisitedSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj.__v;
  return obj;
};
module.exports = Visited = mongoose.model("visit", VisitedSchema);
