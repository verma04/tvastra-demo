const mongoose = require('mongoose');
const medicalImage = require('./../models/medicalImageModel.js');

const medicalReportSchema = new mongoose.Schema({

	report_image_url:{type: [medicalImage]},
	type: {type: String,
	enum: ['Report', 'Prescription', 'Invoice'],
	required: [true, 'Every user must have a gender.']},
	name:{type: String},
	date:{type: Date},
	title: {type: String}

});

const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);

module.exports = {
	MedicalReport: MedicalReport,
	medicalReportSchema: medicalReportSchema
};	
