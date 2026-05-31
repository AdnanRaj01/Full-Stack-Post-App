const mongoose = require('mongoose');
const Post = require('./models/post');

// Connect to MongoDB

main()
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/myappdata');
}

let posts = [
    {
        username: "Adnan Rajput",
        content: "I live web development :)",
    },
     {
        username: "Ali",
        content: "Hardwork is important to achieve success",
    },

];

async function initDB() {
    await Post.deleteMany({});
    await Post.insertMany(posts);

    const allPosts = await Post.find();
    console.log(allPosts);

    console.log('Database initialized');
}

initDB();