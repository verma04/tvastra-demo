const Appointment = require('./../models/appointmentModel');
const Doctor = require('./../models/doctorModel').Doctor;
const User = require('./../models/userModel.js');
const Slot = require('./../models/slotModel.js');
const Mongoose = require('mongoose');
const authenticationController = require('./../controllers/authenticationController');
// const Appointment = require('./../models/appointmentModel.js');

const Nexmo = require('nexmo');
const nexmo = authenticationController.nexmo;



function send(message, recipientAdresses) {

    const from = 'Vonage SMS API';
    const to = '91'+recipientAdresses;
    const text = message;
    
    nexmo.message.sendSms(from, to, text);
}


const loadingDataOnAppointmentPage = async (req, res, next) => {
	// const slots = await Slot.find({ doctor : req.params.id });
	const doctor = await User.findOne({ _id: req.params.id });

	let slot = await Slot.aggregate([
		{
			$match : {
				doctor: Mongoose.Types.ObjectId(req.params.id)
			},	
		},
		{
			$unwind: '$subSlots' 
		},
		{
			$match: {
				'subSlots._id': Mongoose.Types.ObjectId(req.query.slot)
			}
		},
		{
			$limit: 1
		}

	]);
	slot = slot[0];
	console.log(doctor);
	console.log(slot);
	console.log(req.query.date);
	// console.log(subSlot);
	res.render('views/appointment.ejs', { session: req.session, doctor: doctor, slot: slot, date: req.query.date });
}

const createAppointment = async (req, res, next) => {
	console.log(req.query.appointmentDate);
	let appointmentDate = new Date(req.query.appointmentDate);
	console.log(appointmentDate);
	// subslot.isBooked = true;
	const newAppointment = await Appointment.create({
		slot: req.params.id,
		user: req.session.user._id,
		appointmentDate: appointmentDate

	});

	await Slot.findOneAndUpdate({
		subSlots: { $elemMatch: { _id: Mongoose.Types.ObjectId(req.params.id) } }
	},{ 'subSlots.$.isBooked': true });
	// subslot.save();
	req.session.error = 'Appointment Successfully Booked!';
	req.session.errorType = 'Success';
	req.session.appointment = newAppointment;
	console.log(req.session.appointment);
	res.redirect('/appointment-booked');
}

const appointmentBooked = async (req, res, next) => {
	const appointment = req.session.appointment;
	if(appointment){
		const patient = await User.findOne({ _id: appointment.user });
		let subslot = await Slot.aggregate([
			{
				$unwind: '$subSlots'
			},
			{
				$match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
			}

		]);
		subslot = subslot[0];
		console.log(subslot);
		const doctor = await User.findOne({ _id: subslot.doctor });
		res.locals.doctor = doctor;
		res.locals.patient = patient;
		res.locals.subslot = subslot;
		res.locals.appointment = appointment;
		appointmentDate = new Date(appointment.appointmentDate);
		res.locals.appointmentDate = appointmentDate.toDateString();
		console.log(doctor);
		next();
	} else {
		req.session.error = 'Book an appointment first';
		req.session.errorType = 'Failure';
		if(req.session.user.role == 'admin') res.redirect('/admin');
		else res.redirect('/');
	}
}

const getCancelAppointment = async (req, res, next) => {
	const appointment = await Appointment.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
	if(appointment){
		const patient = await User.findOne({ _id: appointment.user });
		let subslot = await Slot.aggregate([
			{
				$unwind: '$subSlots'
			},
			{
				$match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
			}

		]);
		subslot = subslot[0];
		console.log(subslot);
		const doctor = await User.findOne({ _id: subslot.doctor });
		res.locals.doctor = doctor;
		res.locals.patient = patient;
		res.locals.subslot = subslot;
		res.locals.appointment = appointment;
		appointmentDate = new Date(appointment.appointmentDate);
		res.locals.appointmentDate = appointmentDate.toDateString();
		console.log(doctor);
		next();
	}
}

const postCancelAppointment = async (req, res, next) => {
	if(req.params.id){
		const appointment = await Appointment.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
		appointment.status = 'Cancelled';
		appointment.save();
		const slot = await Slot.findOneAndUpdate({
			subSlots: { $elemMatch: { _id: Mongoose.Types.ObjectId(appointment.slot) } }
		},{ 'subSlots.$.isBooked': false });
		console.log('Cancelled');
		req.session.error = 'Appointment Cancelled';
		req.session.errorType = 'Success';

		const user = await User.findOne({ _id: appointment.user });
		const doctor = await User.findOne({ _id: slot.doctor });

		send(new_booking.name + "Appointment has been cancelled successfully .", new_booking.user_phone);


		if(req.session.user.role == 'user'){
			res.redirect('/user-dashboard-appointments');	
		} else {
			res.redirect('/doctor-dashboard');
		}
		
	} else {
		res.redirect('/user-dashboard-appointments');
	}
	
}

const getUserAppointments = async (req, res, next) => {
	const appointments = await Appointment.find({ user: req.session.user._id });
	var slots = [];
	var doctors = [];
	for await(let appointment of appointments){
		// slots = await Slot.findOne({ subSlots: { $elemMatch: { _id: Mongoose.Types.ObjectId(appointment.slot) } } }); 
		subslot = await Slot.aggregate([
			{
				$unwind: '$subSlots'
			},
			{
				$match: { 'subSlots._id': Mongoose.Types.ObjectId(appointment.slot) }
			}
		]);
		slots.push(subslot[0]);
	}
	for await(let subslot of slots){
		doctor = await User.findOne({ _id: Mongoose.Types.ObjectId(subslot.doctor) });
		doctors.push(doctor);
	}
	console.log('getUserAppointments');
	console.log(slots);
	console.log(appointments);
	console.log(doctors);
	res.locals.appointments = appointments;
	res.locals.slots = slots;
	res.locals.doctors = doctors;
	next();
}

const getAppointmentToDoctorDashboard = async (req, res, next) => {
	// console.log(req.session.user);
	// const doctor = await User.findOne({ _id: req.session.user.id });
	// await doctor.populate('slots').execPopulate();
	// console.log(doctor);
	const subslots = await User.aggregate([
		{
			$match: { _id: Mongoose.Types.ObjectId(req.session.user.id) }
		},
		
		{
			$lookup: {
				from: 'slots',
				localField: '_id',
				foreignField: 'doctor',
				as: 'slots'

			}
		},
		{
			$unwind: '$slots'
		},
		{
			$unwind: '$slots.subSlots'
		},
		{
			$match: { 'slots.subSlots.isBooked' : true }
		}
	]);
	console.log(subslots);
	const bookedAppointments = [];
	const patients = [];
	for (let i = 0; i < subslots.length; i++){
		console.log(subslots[i]);
		let appointment = await Appointment.findOne({ slot: Mongoose.Types.ObjectId(subslots[i].slots.subSlots._id) });
		bookedAppointments.push(appointment);
	}
	console.log(bookedAppointments);
	for(let i = 0; i < bookedAppointments.length; i++){
		let user = await User.findOne({ _id: Mongoose.Types.ObjectId(bookedAppointments[i].user) });
		patients.push(user);
	}
	console.log(patients);
	res.locals.appointments = bookedAppointments;
	res.locals.bookedSlots = subslots;
	res.locals.patients = patients;
	next();
}

const getAppointmentToAdminDashboard = async (req, res, next) => {
	const appointments = await Appointment.find();
	// const doctors = [];
	const patients = [];
	const doctors = [];
	for (let i = 0; i < appointments.length; i++){
		let user = await User.findOne({ _id: appointments[i].user });
		patients.push(user);
		let doctor = await User.aggregate([
			{
				$lookup: {
					from: 'slots',
					localField: '_id',
					foreignField: 'doctor',
					as: 'slots'
				}
			},
			{
				$unwind: '$slots'
			},
			{
				$unwind: '$slots.subSlots'
			},
			{
				$match: { 'slots.subSlots._id': appointments[i].slot }
			}
		]);
		doctor = doctor[0];
		doctors.push(doctor);
	}
	console.log(patients);
	console.log(doctors);
	console.log(appointments);

	res.locals.subslots = doctors;
	res.locals.patients = patients;
	res.locals.appointments = appointments;
	next();
}
 
const getRescheduleAppointment = async (req, res, next) => {
	console.log('1');
	const appointment = await Appointment.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
	console.log(appointment);
	let subslot = await Slot.aggregate([
		{
			$unwind: '$subSlots'
		},
		{
			$match: { 'subSlots._id': appointment.slot }
		}

	]);
	subslot = subslot[0];
	const doctor = await User.find({ _id: subslot.doctor });
	console.log(doctor);
	res.locals.doctors = doctor;
	res.locals.appointment = appointment;
	res.locals.currentDay = new Date().getDay();
	res.locals.currentDate = new Date();
	res.locals.subslot = subslot;
	next();
}	

const postRescheduleAppointment = async (req, res, next) => {
	
	const appointment = await Appointment.findOne({ _id: req.params.id });
	await Slot.findOneAndUpdate({
			subSlots: { 
					$elemMatch: { _id: Mongoose.Types.ObjectId(appointment.slot) } 
				}
			},{ 'subSlots.$.isBooked': false });
	await Slot.findOneAndUpdate({
			subSlots: { 
					$elemMatch: { _id: Mongoose.Types.ObjectId(req.query.subslot) } 
				}
			},{ 'subSlots.$.isBooked': true });
	appointment.slot = req.query.subslot;
	appointment.save();
	req.session.error = 'Appointment Rescheduled';
	req.session.errorType = 'Success';
	if (req.session.user.role == 'user') res.redirect('/user-dashboard-appointments');
	else res.redirect('/doctor-dashboard');
}

module.exports = {
	loadingDataOnAppointmentPage: loadingDataOnAppointmentPage,
	createAppointment: createAppointment,
	getUserAppointments: getUserAppointments,
	getAppointmentToDoctorDashboard: getAppointmentToDoctorDashboard,
	getAppointmentToAdminDashboard: getAppointmentToAdminDashboard,
	appointmentBooked: appointmentBooked,
	getCancelAppointment: getCancelAppointment,
	postCancelAppointment: postCancelAppointment,
	getRescheduleAppointment: getRescheduleAppointment,
	postRescheduleAppointment: postRescheduleAppointment
}