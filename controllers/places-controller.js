const { validationResult } = require('express-validator')

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require('../models/place');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const fs = require('fs');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Getting place failed", 500);
    return next(error);
  }

  // return because don't want to execute after that status 404.
  if (!place) {
    const error = new HttpError("Place not available.", 404);
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) }); // => {place: place} = {place}
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;

  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    return next(new HttpError("Getting places by user id failed", 500));
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError("Place not available for the user.", 404));
  }

  res.json({
    places: userWithPlaces.places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed. please check your data', 422);
  }

  const { title, description, address, creator } = req.body;

  let coordinates = getCoordsForAddress(address);

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch(err) {
    const error = new HttpError('Creating Places Failed!', 500);
    return next(err);
  }

  if (!user) {
    return next(new HttpError('could not find user', 404));
  }

  try {
    // if there is an error between the transactions, all will be rollbacked. 
    // if no problem all will be commited.
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    sess.commitTransaction();
  } catch(err) {
    const error = new HttpError('Creating Places Failed!', 500);
    return next(err);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed. please check your data", 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Place not found!", 404));
  }

  place.title = title;
  place.description = description;

  try {
    place.save();
  } catch (err) {
    return next(new HttpError("updating place failed!", 500));
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    // populate will bring the creator object(User)
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    return next(new HttpError("deleting place failed!", 500));
  }

  if (!place) {
    return next(new HttpError("Place not found!", 404));
  }

  const imagePath = place.image;

  try {
    const sess =  await mongoose.startSession();
    sess.startTransaction();
    await Place.deleteOne(place, { session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("deleting place failed!: " + err, 500));
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: 'Place deleted' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
exports.createPlace = createPlace;
