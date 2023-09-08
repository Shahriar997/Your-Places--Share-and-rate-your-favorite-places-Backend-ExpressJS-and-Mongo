const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post(
    '/signup',
    fileUpload.single('image'),
    [
        check('name').notEmpty(),
        check('password').isLength({min: 5}),
        check('email').normalizeEmail().isEmail()
    ],
     usersController.signup
);

router.post(
    '/login',
    [
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 5 })
    ],
    usersController.login
);

module.exports = router;
