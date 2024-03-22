const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const apiSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'user' },   
    created: { type: Date, default: Date.now },
    players:{type:Number},
    bet_amount:{type:Number},
    prize:{type:Number},
    game: {
        type: String,
        enum: ["Roulette"]
    }
});

apiSchema.set('toJSON', { getters: true });
apiSchema.pre(/^find/, function () {
    this.populate('user');
  });
module.exports = mongoose.model('api_key', apiSchema);
