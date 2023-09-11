const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const placesRoutes = require('./routes/places-route');
const HttpError = require('./models/http-error');
const usersRoute = require('./routes/users-route');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join(__dirname,'uploads', 'images'))); // static serving means return a file

// headers to go around the CORS error from the browser
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

//now placesRoutes is just a middleware
app.use('/api/places' ,placesRoutes); // => /api/places...
app.use('/api/users' ,usersRoute); // => /api/users...

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, () =>{
            console.log(error);
        });
    }

    if (res.headerSent) { //if a response has already been sent.
        return next(error); // just pass the error to next middleware
    }
    res
        .status(error.code || 500)
        .json({message: error.message || 'An Unknown error Occurred!'});
});

mongoose.connect('mongodb+srv://shahriar:SoSn4RKilFP6pSsG@myplaces.byzuhgf.mongodb.net/mern-myplaces?retryWrites=true&w=majority')
    .then(
        () => {
            console.log('database connected!');
            app.listen('5000');
        }
    )
    .catch(
        err => {
            console.log(err);
        }
    );
