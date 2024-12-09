const User = require('./../models/userModel');
const multer = require('multer');
const path = require('path');
const Hospital = require('./../models/hospitalModel');
const Doctor = require('./../models/doctorModel');
const Nexmo = require('nexmo');


const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
});
// File Storage
const userFileStorage = multer.diskStorage({
	destination: 'public/uploads/users',
	filename: function(req, file, callback){
		callback(null, `${req.session.user._id}${path.extname(file.originalname)}`);
	}
})

const doctorFileStorage = multer.diskStorage({
    destination: 'public/uploads/doctors',
    filename: function(req, file, callback){
        callback(null, `${req.session.user.phoneNumber}${path.extname(file.originalname)}`);
    }
})


// Init Upload
const uploadUser = multer({
	storage: userFileStorage,
	limits: {fileSize: 1000000},
}).single('display_picture');


const uploadDoctor = multer({
    storage: doctorFileStorage,
    limits: {fileSize: 1000000},
}).single('display_picture');

 
const addDoctorDetails = (req, res, next) => {
	uploadDoctor(req, res, async(err) => {
		if(err){
			req.session.error = err;
			req.session.errorType = 'Failure';
			res.redirect('/');
		} else {
			let hospitals = req.body.hospitalList.slice(1,req.body.hospitalList.length - 1).split(',');
            let achievementList = req.body.achievements.slice(1,req.body.achievements.length - 1).split(',');
            let qualificationList = req.body.qualifications.slice(1,req.body.qualifications.length - 1).split(',');
            let awardsList = req.body.awards.slice(1,req.body.awards.length - 1).split(',');
            let specializationsList = req.body.specializations.slice(1,req.body.specializations.length - 1).split(',');
            // let slotDurationString = req.body.slotDuration.slice(1,req.body.slotDuration.length - 1).split(',');
            let hospitalList = [];
            let achievements = [];
            let qualifications = [];
            let awards = [];
            let specializations = [];
            // let slotDuration = '';
            if(req.body.hospitalList){
                for(let i = 0; i < hospitals.length; i++){
                    hospitalList.push(JSON.parse(hospitals[i]).value);
                }    
            }
            for(let i = 0; i < achievementList.length; i++){
                value = JSON.parse(achievementList[i]).value;
                achievements.push(value);
            }
            if(req.body.awards){
                for(let i = 0; i < awardsList.length; i++){
                    value = JSON.parse(awardsList[i]).value;
                    awards.push(value);
                }    
            }
            for(let i = 0; i < qualificationList.length; i++){
                value = JSON.parse(qualificationList[i]).value;
                qualifications.push(value);
            }
            for(let i = 0; i < specializationsList.length; i++){
                value = JSON.parse(specializationsList[i]).value;
                specializations.push(value);
            }
            const user = await User.findOne({ _id: req.session.user._id });
            user.display_picture = '/' + req.file.path;
            user.doctor = {
            	description: req.body.description,
            	achievements: achievements,
            	experience: req.body.experience,
            	qualifications: qualifications,
            	awards: awards,
            	specializations: specializations,
            	avg_fees: req.body.averageFees,
            	hospitalList: hospitalList
            }
            // user.doctor.description = req.body.description;
            // user.doctor.achievements = achievements;
            // user.doctor.experience = experience;
            // user.doctor.qualifications = qualifications;
            // user.doctor.awards = awards;
            // user.doctor.specializations = specializations;
            // user.doctor.avg_fees = averageFees;
            // user.doctor.hospitalList = hospitalList;
            // user.display_picture = req.file.path;
            await user.save();
            // user.doctor.hospitalList.populate({
            //     path: 'hospitalList'
            // }); 
            req.session.user = user;
            for(let i = 0; i < user.doctor.hospitalList.length; i++){
                const hospital = await Hospital.findOne({ name: user.doctor.hospitalList[i] });
                if(hospital){

                } else {
                    await Hospital.create({
                        name: user.doctor.hospitalList[i]
                    });
                }
            }
            
            req.session.error = 'Doctor Successfully Registered';
            req.session.errorType = 'Success';
            res.redirect('/');
		}
	})
}


const editProfile = (req, res, next) => {
	uploadUser(req, res, async (err) => {
		if(err) {
			req.session.error = err;
			req.session.errorType = 'Failure';
			res.redirect('/edit-profile');
		} else {
			const user = await User.findOne({ email: req.session.user.email });
			user.display_picture = req.file === undefined ? req.session.user.display_picture : '/' + req.file.path;
			user.name = req.body.name;
			user.phoneNumber = req.body.phoneNumber;
			user.email = req.body.email;
			user.gender = req.body.gender;
			user.dob = req.body.dob;
			user.bloodGroup = req.body.bloodGroup;
			user.timeZone = req.body.timeZone;
			user.state = req.body.state;
			user.country = req.body.country;
            user.location = req.body.location;
            if(user.role === 'doctor'){
                let achievementList = req.body.achievements.slice(1,req.body.achievements.length - 1).split(',');
                let qualificationList = req.body.qualifications.slice(1,req.body.qualifications.length - 1).split(',');
                let awardsList = req.body.awards.slice(1,req.body.awards.length - 1).split(',');
                let specializationsList = req.body.specializations.slice(1,req.body.specializations.length - 1).split(',');
                
                let achievements = [];
                let qualifications = [];
                let awards = [];
                let specializations = [];

                for(let i = 0; i < achievementList.length; i++){
                    value = JSON.parse(achievementList[i]).value;
                    achievements.push(value);
                }
                if(req.body.awards){
                    for(let i = 0; i < awardsList.length; i++){
                        value = JSON.parse(awardsList[i]).value;
                        awards.push(value);
                    }    
                }
                for(let i = 0; i < qualificationList.length; i++){
                    value = JSON.parse(qualificationList[i]).value;
                    qualifications.push(value);
                }
                for(let i = 0; i < specializationsList.length; i++){
                    value = JSON.parse(specializationsList[i]).value;
                    specializations.push(value);
                }

                user.doctor = {
                    description: req.body.description,
                    achievements: achievements,
                    experience: req.body.experience,
                    qualifications: qualifications,
                    awards: awards,
                    specializations: specializations,
                    avg_fees: req.body.averageFees,
                }
                await user.save();
                req.session.user = user;
                req.session.error = 'Profile Updated';
                req.session.errorType = 'Success';
                res.redirect('/edit-profile-doctor');
            } else {
                await user.save();
                req.session.user = user;
                req.session.error = 'Profile Updated';
                req.session.errorType = 'Success';
                res.redirect('/edit-profile');   
            }
		}
	})
}


const changePhoneNumber = (req, res, next) => {

    const nexmoRequestOTPCallback = (err, result) => {
        if(err) {
            res.status(400).json({
                status: 'error',
                message: 'Please come back later.'
            })
        }
        else{
            req.session.request_id = result.request_id;
            req.session.phoneNumber = req.body.phoneNumber;
            console.log('Requesting OTP');
            console.log(req.session.request_id);
            req.session.error = 'Valid Only for 60 Secs';
            req.session.errorType = 'Info';
            res.status(200).json({
                status: 'success',
            }); 
        }
    }


    nexmo.verify.request({
        number: '91' + req.body.phoneNumber,
        brand: 'Tvastra',
        code_length: '4',
        workflow_id: '6',
        pin_expiry: '120'
    }, nexmoRequestOTPCallback);
    
}

const changePhoneNumberOTPVerify = (req, res, next) => {

    const nexmoVerifyCallback = (err, result) => {
        if(err) {
            req.session.errorType = 'Failure';
            req.session.error = 'Please try again after some time.';
            res.status(400).json({
                status: 'error',
                message: 'Error'
            });
        }
        else {
            if(result.error_text == 'The code provided does not match the expected value'){
                req.session.errorType = 'Failure';
                req.session.error = 'Incorrect OTP';
                res.status(400).json({
                    status: 'error',
                    message: 'Incorrect OTP'
                });
            } else {
                    const user = User.findOne({ email: req.session.user.email });
                    user.phoneNumber = req.session.phoneNumber;
                    user.save();
                    req.session.errorType = 'Success';
                    req.session.error = 'Phone Number Changed';
                    req.session.userId = req.session.user._id;
                    req.session.request_id = null;
                    req.session.save();
                    res.redirect('/edit-profile');
                    // console.log(req.session);
            }
        }
    }


    req.body.otp = `${req.body.otp_1 + req.body.otp_2 + req.body.otp_3 + req.body.otp_4}`;
    nexmo.verify.check({
        request_id: req.session.request_id,
        code: req.body.otp
    }, nexmoVerifyCallback);

}


const settings = async (req, res) => {
    const user = await User.findOne({ _id: req.session.user.id });
    console.log(user);
    console.log(req.body.new_password);
    console.log(req.body.curr_password);
    console.log(req.body.confirm_password);
    if(user){
        if(req.body.new_password !== req.body.confirm_password){
            req.session.error = 'Passwords Do Not Match';
            req.session.errorType = 'Failure';
            res.redirect('/settings');
        } else {
            if(await user.comparePassword(req.body.curr_password, user.password)){
                user.password = req.body.new_password;
                user.save();
                req.session.error = 'Password Changed Successfully';
                req.session.errorType = 'Success';
                res.redirect('/settings');
            } else {
                req.session.error = 'Current Password is Incorrect';
                req.session.errorType = 'Failure';
                res.redirect('/settings');
            }
        }
    }
}

const getAllUsers = async(req, res, next) => {
    const users = await User.find({ role: 'user' });
    res.locals.users = users;
    next();
}

module.exports = {
	editProfile: editProfile,
	addDoctorDetails: addDoctorDetails,
    changePhoneNumber: changePhoneNumber,
    changePhoneNumberOTPVerify: changePhoneNumberOTPVerify,
    settings: settings,
    getAllUsers: getAllUsers
}