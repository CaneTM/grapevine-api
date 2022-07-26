import express from 'express';
import cors from 'cors';
import knex from 'knex';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;


// use json for data exchange
app.use(express.json());
// trust this server
app.use(cors());

const db = knex({
  client: 'pg', 
  connection: {
    // heroku server has its own env vars
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
    // host : '127.0.0.1',
    // port : 5432,
    // user : 'canaantm',
    // password : '',
    // database : 'twotter'
  }
}); 


// handle a user logging in
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    try {
      db.select('username', 'hash')
        .from('login')
        .where('username', '=', username)
        .then(userLoginData => { // stores data of selected user

          if (userLoginData.length) {
            const { hash } = userLoginData[0];

            bcrypt.compare(password, hash, (err, result) => {
              if (result) {
                res.json("success");
              }
              else {
                res.status(400).json("incorrect username or password");
              }
            }) 
          } 
          else {
            res.status(400).json("incorrect username or password");
          }
        })
        .catch(err => res.status(400).json("incorrect username or password"));
    }
    catch (err) {
      console.log(err);
    }
  }
  else {
    res.json("please enter login info");
  }
});

// handle a user signing up
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const saltRounds = 10;

  if (username && password) {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      db.insert({hash, username})
        .into('login')
        .then(data => res.json('success'))
        .catch(err => res.json('this username is taken'));
    })
  }
  else {
    res.json('please enter valid account info');
  }
});

// update list of user's posts
app.post('/posts', (req, res) => {
  const { content, author, date, time } = req.body;

  if (content) {
    db.insert({content, author, date, time})
    .into('posts')
    .then(data => res.json('success'))
    .catch(err => res.json('error occurred'));
  }
});

// part of a check to determine whether user exists
app.get('/user/:searchfield', (req, res) => {
  const { searchfield } = req.params;

  db.select('username')
    .from('login')
    .where('username', '=', searchfield)
    .then(searchedName => res.json(searchedName));
});

// retrieve posts from specified user
app.get('/posts/:user', (req, res) => {
  const { user } = req.params;

  db.select('*')
    .from('posts')
    .where('author', '=', user)
    .then(postData => res.json(postData))
    .catch(err => res.json(err));
});

// retrieve posts from all users
app.get('/posts', (req, res) => {
  db.select('*')
    .from('posts')
    .then(postData => res.json(postData));
});

app.get('/', (req, res) => {
  res.send('Server running...');
});


app.listen(process.env.PORT || port, () => {
  console.log("Server running...");
});