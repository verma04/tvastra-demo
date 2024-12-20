const app = require('./app');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const mongoose = require('mongoose');


const uri = "mongodb+srv://tvastra:tvastra@cluster0.kzdx3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// const DB = 'mongodb://localhost:27017/myapp';

mongoose
.connect(uri, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false,
	useUnifiedTopology: true
})
.then(() => {console.log('DB Connection Established')});


const port = process.env.PORT || 8000;

app.listen(port, () => {
	console.log(`Server started at port ${port}`);
})


