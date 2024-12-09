const User = require('./../models/userModel');
const bcrypt = require('bcryptjs');
const Nexmo = require('nexmo');
require('dotenv').config( { path: __dirname + '/../config.env' } );
 

// Nexmo used for OTP.
const nexmo = new Nexmo({
	apiKey: process.env.NEXMO_API_KEY,
	apiSecret: process.env.NEXMO_API_SECRET
});

// Check if user is logged in if he is not then redirect to login page. 
const redirectLogin = (req, res, next) => {
	if(!req.session.userId){
		req.session.errorType = 'Failure';
		req.session.error = "Please Login First";
		res.redirect('/email-login');
	} else {
		next();
	}
}

const redirectLogin2 = (req, res, next) => {
	if(!req.session.userId){
		res.redirect('/email-login');
	} else {
		next();
	}
}
 
 

const clearError = (req, res, next) => {
	req.session.error = "";
	next();
}



// Check if user is logged in if he is then redirect to home page.
const redirectHome = (req, res, next) => {
	if(req.session.userId){
		if(req.session.user.role === 'user') res.redirect('/home');
	} else {
		next();
	}
}

const redirectToRespectiveHome = (req, res, next) => {
	if(req.session.userId){
		if(req.session.user.role === 'admin') res.redirect('/admin');
		else res.redirect('/');
	} else {
		next();
	}
}

const signUp = async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		gender: req.body.gender,
		dob: req.body.dob,
		phoneNumber: req.body.phoneNumber,
		email: req.body.email,
		password: req.body.password,
		location: req.body.location,
		state: req.body.state,
		country: req.body.country,
		role: req.body.isDoctor ? 'doctor' : 'user' 	
	});
	req.session.userId = newUser.id;
	req.session.user = newUser;
	if(newUser.role == 'doctor'){
		res.redirect('/doctor-onboarding');
	} else {
		req.session.errorType = 'Success';
		req.session.error = 'Login Successful';
		res.redirect('/');	
	}
}

const emailLogin = async (req, res, next) => {
	if(req.body.email && req.body.password){
		const user = await User.findOne({ email: req.body.email });
		if(user){
			const passwordCorrect = await user.comparePassword(req.body.password, user.password);
			if(passwordCorrect){
				req.session.errorType = 'Success';
				req.session.error = 'Login Successful';
				req.session.userId = user.id;
				req.session.user = user;
				if(req.session.user.role === 'admin') res.redirect('/admin');
				else res.redirect('/');	
			} else {
				req.session.errorType = 'Failure';
				req.session.error = "Incorrect Email or Password."
				res.redirect('/email-login');	
			}
		} else {
			req.session.errorType = 'Failure';
			req.session.error = "Email Not Registered"
			res.redirect('/email-login');
		}
	}
}

const phoneLogin = async (req, res, next) => {
	if(req.body.phoneNumber){
		const user = await User.findOne({ phoneNumber: req.body.phoneNumber });
		// const passwordCorrect = await user.comparePassword(req.body.password, user.password); 
		const nexmoRequestOTPCallback = (err, result) => {
			if(err) console.log(err);
			else{
				req.session.request_id = result.request_id;
				console.log('Requesting OTP');
				console.log(req.session.request_id);
				req.session.user = user;
				req.session.error = 'Valid Only for 60 Secs';
				req.session.errorType = 'Info';
				res.redirect('/otp');	
			}
		}
		if(user){
				nexmo.verify.request({
					number: '91' + req.body.phoneNumber,
					brand: 'Tvastra',
					code_length: '4',
					workflow_id: '6',
					pin_expiry: '120'
				}, nexmoRequestOTPCallback);
				// console.log('91' + req.body.phoneNumber);
		} else {
			req.session.errorType = 'Failure';
			req.session.error = 'Number not associated with any user.';
			res.redirect('/phone-login');
		}
	} else res.redirect('/phone-login');
}

// This function requests OTP for the user number from nexmo.
const checkOTP = async (req, res, next) => {
	const nexmoVerifyCallback = (err, result) => {
		if(err) {
			req.session.errorType = 'Failure';
			req.session.error = 'Please try again after some time.';
			res.redirect('/otp');
		}
		else {
			if(result.error_text == 'The code provided does not match the expected value'){
				req.session.errorType = 'Failure';
				req.session.error = 'Incorrect OTP';
				res.redirect('/otp');
			} else {
				if(req.session.forgetPassword){
					console.log(req.session)
					res.redirect('/create-new-password');
				} else {
					req.session.errorType = 'Success';
					req.session.error = 'Login Successful';
					req.session.userId = req.session.user._id;
					req.session.request_id = null;
					req.session.save();
					// console.log(req.session);
					next();	
				}
					
			}
		}
	}
	req.body.otp = `${req.body.otp_1 + req.body.otp_2 + req.body.otp_3 + req.body.otp_4}`; 
	if(req.body.otp.length === 4){
		nexmo.verify.check({
			request_id: req.session.request_id,
			code: req.body.otp
		}, nexmoVerifyCallback);	
	} else {
		res.redirect('/otp');
	}
}


const checkCancel = (req, res, next) => {
	if(req.session.request_id) res.redirect('/otp');
	else next();
}

const cancelOldOTP = async (req, res, next) => {
	const cancelRequestCallback = (err, result) => {
		if(err) console.log(err);
		else {
			const nexmoRequestOTPCallback = (err, result) => {
				if(err) console.log(err);
				else{
					req.session.request_id = result.request_id;
					console.log('Requesting OTP');
					req.session.error = 'Valid Only for 60 Secs';
					req.session.errorType = 'Info';
					res.redirect('/otp');	
				}
			}



			nexmo.verify.request({
				number: '91' + req.session.user.phoneNumber,
				brand: 'Tvastra',
				code_length: '4',
				workflow_id: '6',
				pin_expiry: '60'
			}, nexmoRequestOTPCallback);
		}
	}

	nexmo.verify.control({
		request_id: req.session.request_id,
		cmd: 'cancel'
	}, cancelRequestCallback);	
}



const checkAdmin = (req, res, next) => {
	if(req.session.user.role === 'admin') {
		next();
	} else {
		req.session.errorType = 'Failure';
		req.session.error = 'Not Authorized';
		console.log(req.session.error);
		res.redirect('/');
	} 
}

const redirectAdmin = (req, res, next) => {
	if(req.session.userId){
		if(req.session.user.role === 'admin'){
			res.redirect('/admin');
		} else {
			next();
		}	
	} 
	
}

const logout = (req, res, next) => {
	delete req.session.userId;
	delete req.session.user;
	req.session.error = '';
	res.redirect('/email-login');
}

const checkIfUserExists = async (req, res, next) => {
	console.log('Checking if user exists');
	console.log(req.body.email);
	if(req.body.email){
		const user = await User.findOne({ email: req.body.email });
		if(user){
			req.body.phoneNumber = user.phoneNumber;
			req.session.forgetPassword = true;
			next();
		} else {
			req.session.error = 'Email Not registered';
			req.session.errorType = 'Failure';
			res.redirect('/email-login');
		}
	} else {
		req.session.error = 'Please provide your email',
		req.session.errorType = 'Failure',
		res.redirect('/email-login');
	}
}

const changePassword = async (req, res, next) => {
	if(req.body.newPassword === req.body.newPasswordConfirm){
		const user = await User.findOne({ email: req.session.user.email });
		user.password = req.body.newPassword;
		await user.save();
		req.session.forgetPassword = false;
		req.session.error = 'Password Changed Successfully';
		req.session.errorType = 'Success';
		req.session.request_id = null;
		delete req.session.user;
		delete req.session.userId;
		res.redirect('/email-login'); 
	} else {
		req.session.error = 'Passwords do not match';
		req.session.errorType = 'Failure';
		res.redirect('/create-new-password');
	}
}

const checkOnboarding = (req, res, next) => {
	console.log(req.session.user);
	if(req.session.user.role === 'doctor'){
		console.log(req.session.user.doctor);
		if(req.session.user.doctor){
			next();
		} else {
			res.redirect('/doctor-onboarding');
		}
	} else {
		next();
	}
}

const onBoardingDone = (req, res, next) => {
	if(req.session.user){
		if(req.session.user.doctor){
			res.redirect('/');
		} else {
			next();
		}	
	} else {
		req.session.error = 'Please Login First';
		req.session.errorType = 'Failure';
		res.redirect('/email-login');
	}
	
}

module.exports = {
	redirectLogin: redirectLogin,
	redirectLogin2: redirectLogin2,
	signUp: signUp,
	redirectHome: redirectHome,
	phoneLogin: phoneLogin,
	emailLogin: emailLogin,
	checkOTP: checkOTP,
	checkCancel: checkCancel,
	logout: logout,
	clearError: clearError,
	checkAdmin: checkAdmin,
	redirectAdmin: redirectAdmin,
	redirectToRespectiveHome: redirectToRespectiveHome,
	cancelOldOTP: cancelOldOTP,
	checkIfUserExists: checkIfUserExists,
	changePassword: changePassword,
	checkOnboarding: checkOnboarding,
	onBoardingDone: onBoardingDone,
	nexmo: nexmo
}