const MedicalReport = require('./../models/medicalReportModel.js').MedicalReport;

const multer = require('multer');
const path = require('path');
const User = require('./../models/userModel.js');
const mkdirp = require('mkdirp');


const storeMulti = multer.diskStorage({
    destination: function(req,file,callback){
        let id = req.session.user._id;
        let dest = 'public/uploads/reports/' + id;
        mkdirp.sync(dest);

        callback(null,dest)
    },
    filename: function(req, file,callback){
        callback(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})



const multiupload = multer({
    storage: storeMulti
}).array("medicalphoto[]",10);



const fileArray = (photos,id)=>{
    arr = [];
    photos.forEach(element=>{
        arr.push("./public/uploads/reports/"+id + "/" + element.filename)
    })
    return arr;
}





const showReport = async (req,res)=>{

    console.log(req.params.id)
    let report_id = await User.findOne({_id: req.session.user._id},{"reports":{$elemMatch:{_id: req.params.id}}})
    console.log(report_id);
    res.render("views/openReport",{report: report_id, session:req.session, user:req.session.user, error: req.session.error, errorType: req.session.errorType});
}


const createMedicalReport = (req,res)=>{
    console.log(req.files);
    multiupload(req, res, async (err)=>{
        if(err){
            console.log(err);
            res.redirect("/user-dashboard-medical-records");
        }else{
            let addressArray = [];

            addressArray = await fileArray(req.files,req.session.user._id);
            let finalArray = [{image_url:addressArray}]
            let userreport = await User.findOneAndUpdate({_id:req.session.user._id},
                {$push:{
                    reports:{
                    "report_image_url":finalArray,
	                type: req.body.typeOfRecord,
	                name: req.body.name,
	                date: req.body.record_date,
	                title: req.body.title
                    }
                }

            })

            req.session.user = await User.findOne({_id: req.session.user._id});
            res.redirect("/user-dashboard-medical-records")
        }
    })
    
}


const update_record = async (req,res)=>{
    multiupload(req, res, async (err)=>{
        if(err){
            console.log(err);
            res.redirect("/user-dashboard-medical-records");
        }else{
            let addressArray = [];
            console.log(addressArray);
            addressArray = await fileArray(req.files,req.session.user._id);
            let userreport = await User.findOneAndUpdate({_id:req.session.user,"reports._id": req.body.report_id}, {$push: {"reports.$.report_image_url": {image_url:addressArray}}})

        }
        req.session.user = await User.findOne({_id: req.session.user._id});
        res.redirect(`/user-dashboard-medical-records/showReport/${req.body.report_id}`);
    })
}



const delete_record = async (req,res)=>{

    let userreport = await User.findOneAndUpdate({_id:req.session.user},
        {
            $pull:{"reports":{_id: req.query.id} }
        })

    req.session.user = await User.findOne({_id: req.session.user._id});
    res.redirect("/user-dashboard-medical-records")

}


const delReport = async(req,res)=>{

    let userreport = await User.findOneAndUpdate({_id:req.session.user._id,"reports._id":req.body.report_id},
        {
            $pull:{"reports.$.report_image_url":{_id: req.body.report_image} }
        })
        req.session.user = await User.findOne({_id: req.session.user._id});
    res.redirect(`/user-dashboard-medical-records/showReport/${req.body.report_id}`)
}




module.exports = {
	showReport: showReport,
	createMedicalReport: createMedicalReport,
	update_record: update_record,
	delete_record: delete_record,
	delReport: delReport
}

