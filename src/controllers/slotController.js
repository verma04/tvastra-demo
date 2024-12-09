const Slot = require('./../models/slotModel.js');
const Mongoose = require('mongoose');

const addSlot = async (req, res, next) => {
	const allSlots = await Slot.find({ 
		$and: [
			{
				doctor: req.session.user._id
			},
			// {
			// 	holiday: false
			// },
			{
				isDisabled: false
			}
		]
	});
	if(allSlots.length){
		const valid = await isValidateSlot(allSlots, req.body);
		if(valid){
			// let intervalString = req.body.interval.slice(1,req.body.interval.length - 1).split(',');
			// let interval = [];
			let hospitals = req.body.hospital.slice(1,req.body.hospital.length - 1).split(',');
			let hospital = [];
			for(let i = 0; i < hospitals.length; i++){
		        value = JSON.parse(hospitals[i]).value;
		        hospital.push(value);
		    }
			// for(let i = 0; i < intervalString.length; i++){
		 //        value = JSON.parse(intervalString[i]).value;
		 //        interval.push(value);
		 //    }
		 	const slotTimeValidate = slotTimeValidation(req.body);
		 	if(slotTimeValidate === 'Valid'){
		 		const slot = await Slot.create({
					startTime: req.body.startTime,
					endTime: req.body.endTime,
					days: req.body.days,
					interval: req.body.interval,
					hospital: hospital[0],
					holiday: req.body.holiday ? true : false,
					doctor: req.session.user._id
				});
				req.session.error = 'Slot Succesfully Added';
				req.session.errorType = 'Success';
				res.redirect('/schedule-appointment');	
		 	} else {
		 		req.session.error = slotTimeValidate;
		 		req.session.errorType = 'Failure';
		 		res.redirect('/schdeule-appointment');
		 	}
					
		} else {
			req.session.error = "Time Overlap";
			req.session.errorType = 'Failure';
			res.redirect('/schedule-appointment');
		}
	} else {
		// let intervalString = req.body.interval.slice(1,req.body.interval.length - 1).split(',');
		// let interval = [];
		let hospitals = req.body.hospital.slice(1,req.body.hospital.length - 1).split(',');
		let hospital = [];
		for(let i = 0; i < hospitals.length; i++){
	        value = JSON.parse(hospitals[i]).value;
	        hospital.push(value);
	    }
		// for(let i = 0; i < intervalString.length; i++){
	 //        value = JSON.parse(intervalString[i]).value;
	 //        interval.push(value);
	 //    }
	    const slotTimeValidate = slotTimeValidation(req.body);
	    if(slotTimeValidate === 'Valid'){
	    	const slot = await Slot.create({
				startTime: req.body.startTime,
				endTime: req.body.endTime,
				days: req.body.days,
				interval: req.body.interval,
				hospital: hospital[0],
				holiday: req.body.holiday ? true : false,
				doctor: req.session.user._id
			});
			req.session.error = 'Slot Succesfully Added';
			req.session.errorType = 'Success';
			res.redirect('/schedule-appointment');	
	    } else {
	    	req.session.error = slotTimeValidate;
	    	req.session.errorType = 'Failure';
	    	res.redirect('/schedule-appointment'); 
	    }
		
	}	
}

const slotTimeValidation = (slot) => {
	const startTime = parseInt(slot.startTime.split(':')[0]);
	const endTime = parseInt(slot.endTime.split(':')[0]);
	const interval = slot.interval;
	const startTimeDate = new Date();
	startTimeDate.setHours(startTime);
	const endTimeDate = new Date();
	endTimeDate.setHours(endTime);
	if(startTime > endTime){
		return 'Invalid End Time';
	} else if(((endTimeDate - startTimeDate) /3600) <= interval){
		return 'Invalid Interval';
	} else {
		return 'Valid';
	}
}

const isValidateSlot = async (slots, slot) => {
	for(let i = 0; i < slots.length; i++){
		for(let j = 0; j < slots[i].days.length; j++){	
			if(slot.days.indexOf(slots[i].days[j]) !== -1){
				if(slot.startTime <= slots[i].startTime && slot.endTime >= slots[i].endTime){
					return false 
				} else {
					if(slot.startTime >= slots[i].startTime && slot.startTime <= slots[i].endTime && slot.endTime >= slots[i].endTime){
						return false;
					} else {
						if(slot.startTime >= slots[i].startTime  && slot.endTime <= slots[i].endTime){
							return false
						} else {
							if(slot.startTime <= slots[i].startTime && slot.endTime >= slots[i].startTime && slot.endTime <= slots[i].endTime){
								return false;
							} else {
								return true;
							}
						}
					}
				}
			} 
		}
	}
	return true;
}

const getSlotsBasedOnDoctor = async (req, res, next) => {
	res.locals.slots = await Slot.find({ 
		$and: [
			{
				doctor: req.session.user._id
			},
			// {
			// 	holiday: false
			// },
			{
				isDisabled: false
			}
		]
		 
	});
	next();
}

const disableSlot = async (req, res) => {
	var slot = await Slot.findOne({
		$and: [
			{
				_id: req.params.id
			},
			{
				startTime: req.query.startTime
			},
			{
				endTime: req.query.endTime
			},
			{
				days: { $in: [req.query.day] }
			}
		]
	});
	slot.days.splice(slot.days.indexOf(req.query.day),1);
	if(slot.days.length){
		await Slot.findOneAndUpdate({
			$and: [
				{
					_id: req.params.id
				},
				{
					startTime: req.query.startTime
				},
				{
					endTime: req.query.endTime
				},
				{
					days: { $in: [req.query.day] }
				}
			]
		}, { days: slot.days });	
	} else {
		await Slot.findOneAndUpdate({
			$and: [
				{
					_id: req.params.id
				},
				{
					startTime: req.query.startTime
				},
				{
					endTime: req.query.endTime
				},
				{
					days: { $in: [req.query.day] }
				}
			]
		}, { isDisabled: true });
	}
	
	res.redirect('/schedule-appointment');
}

const editSubSlot = async (req, res, next) => {
	const disableThisSubslots = req.body.disabled;
	const enableThisSubslots = req.body.enabled;

	if(disableThisSubslots){
		for(let i = 0; i < disableThisSubslots.length; i++){
			await Slot.findOneAndUpdate({
				subSlots: { $elemMatch: { _id: Mongoose.Types.ObjectId(disableThisSubslots[i]) } }
			},{ 'subSlots.$.isDisabled': true });	
		}	
	}

	if(enableThisSubslots){
		for(let i = 0; i < enableThisSubslots.length; i++){
			await Slot.findOneAndUpdate({
				subSlots: { $elemMatch: { _id: Mongoose.Types.ObjectId(enableThisSubslots[i]) } }
			},{ 'subSlots.$.isDisabled': false });	
		}	
	}
	
	res.redirect('/schedule-appointment');
}

const editSlot = async (req, res, next) => {
	const holidayArray = req.body.holiday;
	if(holidayArray){
		for(let i = 0; i < holidayArray.length; i++){
			let slot = await Slot.findOne({ _id: Mongoose.Types.ObjectId(holidayArray[i]) });
			if(slot.holiday){
				await Slot.findOneAndUpdate({ _id: Mongoose.Types.ObjectId(holidayArray[i])},
				{ 'holiday': false });
			} else {
				await Slot.findOneAndUpdate({ _id: Mongoose.Types.ObjectId(holidayArray[i])},
				{ 'holiday': true });
			}
		}
	}


	res.redirect('/schedule-appointment');
}

module.exports = {
	addSlot: addSlot,
	getSlotsBasedOnDoctor: getSlotsBasedOnDoctor,
	disableSlot: disableSlot,
	editSubSlot: editSubSlot,
	editSlot: editSlot
}