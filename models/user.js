const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

// array in places because it says one user can have multiple places
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, require: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
