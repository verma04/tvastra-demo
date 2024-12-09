const mongoose = require('mongoose');

const medicalImage = new mongoose.Schema({
	image_url : [{type: String}]
});

module.exports = medicalImage;
