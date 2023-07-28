const express = require('express');
const bodyParser = require('body-parser');

const placesRoutes = require('./routes/places-route');
const HttpError = require('./models/http-error');
const usersRoute = require('./routes/users-route');

const app = express();

app.use(bodyParser.json());

//now placesRoutes is just a middleware
app.use('/api/places' ,placesRoutes); // => /api/places...
app.use('/api/users' ,usersRoute); // => /api/users...

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (res.headerSent) { //if a response has already been sent.
        return next(error); // just pass the error to next middleware
    }
    res
        .status(error.code || 500)
        .json({message: error.message || 'An Unknown error Occurred!'});
});

app.listen('5000');
