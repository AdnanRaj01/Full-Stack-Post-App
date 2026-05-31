const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

console.log(passportLocalMongoose);

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    otp: String,
    otpExpiry: Date
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;