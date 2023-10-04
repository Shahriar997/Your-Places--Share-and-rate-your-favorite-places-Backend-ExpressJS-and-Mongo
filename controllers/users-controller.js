const { v4: uuid } = require("uuid");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    // -password means do not get passwords
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("Getting all users failed: " + err, 500));
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Input. Please check your data!", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Sign Up failed!", 500));
  }

  if (existingUser) {
    return next(
      new HttpError("User Exist Already. Please log in instead.", 422)
    );
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could Not Create User. please try again", 500));
  }

  const user = new User({
    name,
    email,
    password: crypto.createHash("sha256").update(password).digest("hex"),
    image: req.file.path,
    places: [],
  });

  let createdUser;

  try {
    createdUser = await user.save();
  } catch (err) {
    return next(new HttpError("Creating user failed!: " + err, 500));
  }

  let token;

  try {
    // returns a string;
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Creating user failed!: " + err, 500));
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array() });
  }

  const { email, password } = req.body;

  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("login in failed!", 500));
  }

  if (identifiedUser === null) {
    return next(new HttpError("User not found with the email!", 404));
  }

  let isValidPassword;

  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (err) {
    return next(
      new HttpError("Could not log you in. please check your credentials.", 500)
    );
  }

  if (!isValidPassword) {
    return next(new HttpError("Wrong Password!", 401));
  }

  let token;

  try {
    // returns a string;
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("User login failed!: " + err, 500));
  }

  res.json({
    message: "logged in!",
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
