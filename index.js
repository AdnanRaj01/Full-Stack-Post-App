const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Post = require('./models/post');
require('dotenv').config();
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const methodOverride = require('method-override');

// Middleware setup

app.use(methodOverride('_method'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session and Passport configuration

const sessionOptions = {
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false    
};
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash message middleware and Current user middleware

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Nodemailer transporter setup

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Connect to MongoDB

main()
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/myappdata');
}

// lOGIN CHECK MIDDLEWARE

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You must be logged in to do that.');
    res.redirect('/login');
}

// Home Route

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Signup Routes

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("Signup data:", req.body);

        let newUser = new User({
            username,
            email
        });

        const registeredUser = await User.register(
            newUser,
            password
        );

        console.log("Registered User:", registeredUser);

        req.flash(
            'success',
            'Account created successfully!'
        );

        res.redirect('/login');

    } catch (e) {

        console.log("SIGNUP ERROR:");
        console.log(e);
        console.log(e.stack);

        req.flash(
            'error',
            e.message
        );

        res.redirect('/signup');
    }
});

// Login Routes

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), async (req, res) => {
    req.flash('success', 'Welcome back!');
    res.redirect('/secret');
});

// Logout Route

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        req.flash('success', 'You have logged out successfully!');
        res.redirect('/login');
    });
});

// Secret Route

app.get('/secret', isLoggedIn, (req, res) => {
    res.send(
        `<h1>Secret Page</h1>
        <p>Welcome, ${req.user.username}!</p><br><br>
        <a href="/posts">Go to Posts</a><br><br>
        <a href="/logout">Logout</a>`
    );
});

// Forgot Password Routes

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.post('/forgot-password',async (req, res) => {
        try{
            let { email } = req.body;
            let user = await User.findOne({
                email
            });
            if(!user){
                req.flash('error','Email not found');
                return res.redirect(
                    '/forgot-password'
                );
            }
            const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false,
                    specialChars: false
                }
            );
            user.otp = otp;
            user.otpExpiry = Date.now() + 300000;
            await user.save();
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset OTP',

                html: `
                    <h2>
                        Your OTP Code
                    </h2>

                    <h1>
                        ${otp}
                    </h1>

                    <p>
                        OTP valid for
                        5 minutes
                    </p>
                `
            });

            res.render('verify-otp',{ email });
        }catch(err){
            console.log(err);
            res.send(err.message);
        }
    }
);

// Verify OTP Route

app.post('/verify-otp', async (req, res) => {
    try{
        let { email, otp } = req.body;
        let user = await User.findOne({ email });
        if(!user){
            req.flash('error', 'User not found');
            return res.redirect('/forgot-password');
        }
        if(user.otp !== otp){
            req.flash('error', 'Invalid OTP');
            return res.redirect('/forgot-password');
        }
        if(Date.now() > user.otpExpiry){
            req.flash('error', 'OTP has expired');
            return res.redirect('/forgot-password');
        }
        res.render('reset-password', { email });
    }catch(err){
        console.log(err);
        res.send(err.message);
    }
});

// Reset Password Route

app.post('/reset-password', async (req, res) => {
    try{
        let { email, password, confirmPassword } = req.body;
        let user = await User.findOne({ email });
        if(!user){
            req.flash('error', 'User not found');
            return res.redirect('/forgot-password');
        }
        if(password !== confirmPassword){
            req.flash('error', 'Passwords do not match');
            return res.redirect('/forgot-password');
        }
        await user.setPassword(password);
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        req.flash('success', 'Password reset successfully!');
        res.redirect('/login');
    }catch(err){
        console.log(err);
        res.send(err.message);
    }
});

// Index Route

app.get('/posts', isLoggedIn, async (req, res) => {
    const posts = await Post.find();
    res.render('index.ejs', { posts });
});

// New Route

app.get('/posts/new', isLoggedIn, (req, res) => {
    res.render('new.ejs');
});

app.post('/posts', isLoggedIn, async (req, res) => {
    let { username, content } = req.body;
    let newPost = new Post({ username, content });
    await newPost.save();
    res.redirect('/posts');
});

// Show Route

app.get('/posts/:id', isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid Post ID');
        }
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('show.ejs', { post });
    } catch (err) {
        console.log(err);
        res.status(500).send(err.message);
    }
});

// Edit Route

app.get('/posts/:id/edit', isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid Post ID');
        }
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('edit.ejs', { post });
    } catch (err) {
        console.log(err);
        res.status(500).send(err.message);
    }
});

app.put('/posts/:id', isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        let { username, content } = req.body;
        const post = await Post.findByIdAndUpdate(
            id,
            {
                username,
                content
            },
            {
                new: true
            }
        );
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.redirect('/posts');
    } catch (err) {
        console.log(err);
        res.status(500).send(err.message);
    }
});

// Delete Route

app.delete('/posts/:id', isLoggedIn, async (req, res) => {

    await Post.findByIdAndDelete(req.params.id);

    res.redirect('/posts');

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



