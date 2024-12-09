const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
	name: { type: String, required: true },
	specializations: { type: [String] },
	location: { type: String },
	noOfBeds: { type: Number },
	display_picture: { type: String },
	address: { type: String },
	description: { type: String },
	mobile: { type: Number },
	email: { type: String },
	yearsOfEstablishment: { type: Number },
	avg_fees: { type: [String] },
	isVerified: {
		type: Boolean,
		default: false
	}
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;