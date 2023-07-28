const { v4: uuid } = require('uuid');
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');

const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Shahriar',
        email: 'shahriar@gmail.com',
        password: 'testers'
    }
]

const getUsers = (req, res, next) => {
    res.json({users: DUMMY_USERS});
};

const signup = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array() });
    }

    const { name, email, password } = req.body;

    const hasUser = DUMMY_USERS.find( u => u.email === email );

    if(hasUser) {
        throw new HttpError('User Already Exists', 422);
    }

    const createdUser = {
        id: uuid(),
        name,
        email,
        password
    }

    DUMMY_USERS.push(createdUser);

    res.status(201).json({user: createdUser});
};

const login = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array() });
    }

    const { email, password } = req.body;

    const identifiedUser = DUMMY_USERS.find(u => u.email === email && u.password === password);

    if (!identifiedUser) {
        throw new HttpError('Could Not identify User. Wrong credentials', 401);
    }

    res.json({message: 'logged in!'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
