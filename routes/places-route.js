const express = require('express');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');

const placesController = require('../controllers/places-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// everyone can hit this route
router.get('/:pid', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

// auth check middleware

router.use(checkAuth);

// protected routes
router.post(
    '/', 
    fileUpload.single('image'),
    [
        check('title').notEmpty(), 
        check('description').isLength({min: 5}),
        check('address').notEmpty()
    ],
    placesController.createPlace
);

router.patch(
    '/:pid', 
    [
        check('title').notEmpty(),
        check('description').isLength({min: 5})
    ],
    placesController.updatePlaceById
);

router.delete('/:pid', placesController.deletePlace);

module.exports = router;
