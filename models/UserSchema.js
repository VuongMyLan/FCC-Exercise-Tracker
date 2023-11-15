const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseSchema = new Schema({
    description: { type: String, require: true },
    duration: { type: Number, require: true },
    date: Date,
});

const userSchema = new Schema({
    username: { type: String, require: true },
    log: [exerciseSchema],
});

const User = mongoose.model('users', userSchema);
const Exercises = mongoose.model('exercise', exerciseSchema);

module.exports = {
    Exercises,
    User,
};
