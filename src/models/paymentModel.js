const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  	date : {type: Date},
    details: {type:String},
    status: { type: String, enum: ['Approved', 'Cancelled', 'Rejected', 'Pending'] },
    price : {type: Number}
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;