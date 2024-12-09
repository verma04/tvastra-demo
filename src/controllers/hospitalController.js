const Hospital = require('./../models/hospitalModel.js');
const Mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const hospitalFileStorage = multer.diskStorage({
    destination: 'public/uploads/hospitals',
    filename: function(req, file, callback){
        callback(null, `${req.session.hospital.name}${path.extname(file.originalname)}`)
    }
})


const uploadHospital = multer({
    storage: hospitalFileStorage,
}).single('display_picture');

// const getAllDoctors = async (req, res, next) => {
// 	const doctors = await Doctor.find(req.query);
// 	console.log(req.query);
// 	console.log('getAllDoctors');
// 	res.locals.doctors = doctors;
// 	next();
// }

const getAllHospitals = async (req, res, next) => {
	let beds = req.query.beds;
    let treatments = req.query.treatment;
    if(beds && beds instanceof Array) {
        beds = beds.map(e => Number(e));
        beds = Math.min(...beds);
    }
    // console.log({ role : "doctor", ...req.query, beds: { $gte : beds || 0 }});
    console.log(req.query);
    if(treatments) {
        if(typeof(treatments) == 'string'){
            treatments  = [];
            treatments.push(req.query.treatment);
            console.log(treatments);
            const hospitals = await Hospital.find({...req.query, beds: { $gte : beds || 0 },  listOfTreatment: { $in: treatments } });
            res.locals.hospitals = hospitals;
            console.log(hospitals); 
        } else {
            const hospitals = await Hospital.find({...req.query, beds: { $gte : beds || 0 }, listOfTreatment: { $in: treatments }});
            res.locals.hospitals = hospitals;
        }  
    } else {
        const hospitals = await Hospital.find({...req.query, beds: { $gte : beds || 0 }});
        res.locals.hospitals = hospitals; 
    }
    next();
}

const autoCompleteHospitals = async (req, res, next) => {
    const hospitals = await Hospital.find({}, {'name': 1, "_id": 1});
    res.json({
        data: hospitals
    });
} 


const getAllHospitalsAdmin = async (req, res, next) => {
    const hospitals = await Hospital.find();
    res.locals.hospitals = hospitals;
    next();
}

const getVerifyHospital = async (req, res, next) => {
    const hospital = await Hospital.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
    res.locals.hospital = hospital;
    next();
}

const postVerifyHospital = async (req, res, next) => {
    req.session.hospital =  await Hospital.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
    uploadHospital(req, res, async(err) => {
        if(err) {
            req.session.error = err;
            req.session.errorType = 'Failure';
            res.redirect(`/add-hospitals`);
        } else {
            const hospital = await Hospital.findOne({ _id: Mongoose.Types.ObjectId(req.params.id) });
            let specializationsList = req.body.specializations.slice(1,req.body.specializations.length - 1).split(',');
            let specializations = [];
            for(let i = 0; i < specializationsList.length; i++){
                value = JSON.parse(specializationsList[i]).value;
                specializations.push(value);
            }
            hospital.name = req.body.name;
            hospital.specializations = specializations;
            hospital.location = req.body.city;
            hospital.noOfBeds = req.body.noOfBeds;
            hospital.display_picture = '/' + req.file.path;
            hospital.address = `${req.body.address}, ${req.body.city}, ${req.body.state}`;
            hospital.avg_fees = req.body.avg_fees;
            hospital.isVerified = true;
            hospital.phoneNumber = req.body.phoneNumber;
            hospital.save();
            req.session.hospital = undefined;
            req.session.error = 'Hospital Verified';
            req.session.errorType = 'Success';
            res.redirect('/admin-hospitals');
        }
            
    });
    
}

module.exports = {
	getAllHospitals: getAllHospitals,
    autoCompleteHospitals: autoCompleteHospitals,
    getAllHospitalsAdmin: getAllHospitalsAdmin,
    getVerifyHospital: getVerifyHospital,
    postVerifyHospital: postVerifyHospital
}