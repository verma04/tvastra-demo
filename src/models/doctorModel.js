const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
	achievements: [String],
	experience: Number,
	location: String,
	description: String,
	specializations: { type: [String] },
	qualifications: { type: [String] },
	awards: { type: [String] },
	avg_fees: { type: Number },
	startTime: { type: String },
	endTime: { type: String },
	slotDuration: { type: Number },
	subslots: [],
	hospitalList: [String]
	// slots ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
}, {
	toJSON: { virtuals : true },
	toObject: { virtuals : true },
});


// doctorSchema.pre('save', async function(next){
// 	const passwordValidator = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
// 	if(this.isModified('password')){
// 		if(passwordValidator.test(this.password)) next();
// 		else {
// 			const err = new Error('Password must contain One Uppercase, One lowercase and One number character');
// 			next(err);
// 		}
// 	}
// })

// doctorSchema.pre('save', async function(next) {
// 	if(this.isModified('password')){
// 		this.password = await bcrypt.hash(this.password, 12);
// 		next();	
// 	}
// });

// doctorSchema.methods.comparePassword = async function(hashedPassword, enteredPassword) {
// 	return await bcrypt.compare(hashedPassword, enteredPassword);
// }




const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = {
	doctorSchema: doctorSchema,
	Doctor: Doctor
};