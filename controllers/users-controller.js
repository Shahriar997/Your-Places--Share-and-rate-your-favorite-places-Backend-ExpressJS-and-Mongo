const { v4: uuid } = require("uuid");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const crypto = require("crypto");

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

  const user = new User({
    name,
    email,
    password: crypto.createHash("sha256").update(password).digest("hex"),
    image: 'https://scontent.fdac152-1.fna.fbcdn.net/v/t39.30808-6/318971003_1901192516879013_4335193165971220038_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=09cbfe&_nc_eui2=AeHUf82LwvntaxFDAu3HiDifPpjYuMjEzrM-mNi4yMTOs8TrzkF1Ua841SyNInQoXv4-xrcpgr4A7ld1E1xLe2tf&_nc_ohc=XeQTbOg18i0AX-BuSH7&_nc_ht=scontent.fdac152-1.fna&oh=00_AfDUjGIfq6j77dpTU12hgXmFOgg7axWs_DO3pQPqjJ3D1A&oe=64F0A9D1',
    places: [],
  });

  let createdUser;

  try {
    createdUser = await user.save();
  } catch (err) {
    return next(new HttpError("Creating user failed!: " + err, 500));
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
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
    return next(new HttpError("logging in failed!", 500));
  }

  if (identifiedUser === null) {
    return next(new HttpError("User not found with the email!", 404));
  }

  if (
    identifiedUser.password !==
    crypto.createHash("sha256").update(password).digest("hex")
  ) {
    return next(new HttpError("Wrong Password!", 401));
  }

  res.json({ message: "logged in!", user: identifiedUser.toObject({ getters: true })});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
