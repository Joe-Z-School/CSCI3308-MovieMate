// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use(express.static(__dirname + '/'));

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

const user = {
    username: undefined,
    password: undefined
};

// TODO - Include your API routes here
app.get('/', (req, res) => {
    res.redirect('/login'); //this will call the /anotherRoute route in the API
  });
  
  app.get('/login', (req, res) => {
    //do something
    res.render('pages/login');
  });


  app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
       
        const result = await db.query('SELECT * FROM users WHERE username = $1', [req.body.username]);
       
        if (result.length === 0) {
            return res.render('pages/register', {
                message: 'Username not found.',
            });
        }
 
 
        const user = result[0];
        console.log('User from DB:', user);
        console.log('Entered password:', password);
 
 
        const match = await bcrypt.compare(req.body.password, user.password);
 
 
        if (!match) {
            return res.render('pages/login', {
                message: 'Incorrect username or password.',
            });
        }
 
 
        req.session.user = user;
        req.session.save();
        res.redirect('discover');
    } catch (err) {
        res.render('pages/login', { message: 'Error during login. Please try again.' });
    }
 });
 

  app.get('/register', (req, res) => {
    //do something
    res.render('pages/register');
  });



// *****************************************************
// <!-- Friends Posts -->

// Sample data
const posts = [
  { id: '1', user: 'A', title: 'Inception', review: '4', description: 'A mind-bending thriller by Nolan.', cover: 'cover1.jpg', whereToWatch: 'Netflix' },
  { id: '2', user: 'B', title: 'Interstellar', review: '3.5', description: 'Explores the stars and time.', cover: 'cover2.jpg', whereToWatch: 'Hulu' },
  { id: '3', user: 'C', title: 'TestTitle3', review: '3', description: 'Test Description for TestTitle3.', cover: 'cover3.jpg', whereToWatch: 'HBO' },
  { id: '4', user: 'D', title: 'TestTitle4', review: '1.1', description: 'Test Description for TestTitle4.', cover: 'cover4.jpg', whereToWatch: 'Netflix' },
  { id: '5', user: 'E', title: 'TestTitle5', review: '5', description: 'Test Description for TestTitle5.', cover: 'cover5.jpg', whereToWatch: 'HBO' },
  { id: '6', user: 'F', title: 'TestTitle6', review: '4.1', description: 'Test Description for TestTitle6.', cover: 'cover6.jpg', whereToWatch: 'Paramount' },
  { id: '7', user: 'G', title: 'TestTitle7', review: '2.5', description: 'Test Description for TestTitle7.', cover: 'cover7.jpg', whereToWatch: 'Disney' },
  { id: '8', user: 'H', title: 'TestTitle8', review: '3', description: 'Test Description for TestTitle8.', cover: 'cover8.jpg', whereToWatch: 'Netflix' },
  { id: '9', user: 'I', title: 'TestTitle9', review: '1', description: 'Test Description for TestTitle9.', cover: 'cover9.jpg', whereToWatch: 'Netflix' },
  { id: '10', user: 'J', title: 'TestTitle10', review: '1', description: 'Test Description for TestTitle10.', cover: 'cover10.jpg', whereToWatch: 'HBO' },
  { id: '11', user: 'K', title: 'TestTitle11', review: '4', description: 'Test Description for TestTitle11.', cover: 'cover11.jpg', whereToWatch: 'Hulu' },
  { id: '12', user: 'L', title: 'TestTitle12', review: '2.1', description: 'Test Description for TestTitle12.', cover: 'cover12.jpg', whereToWatch: 'Hulu' },
  { id: '13', user: 'M', title: 'TestTitle13', review: '4.8', description: 'Test Description for TestTitle13.', cover: 'cover13.jpg', whereToWatch: 'Disney' },
  { id: '14', user: 'N', title: 'TestTitle14', review: '2.7', description: 'Test Description for TestTitle14.', cover: 'cover14.jpg', whereToWatch: 'Disney' },
  { id: '15', user: 'O', title: 'TestTitle15', review: '1.9', description: 'Test Description for TestTitle15.', cover: 'cover15.jpg', whereToWatch: 'Paramount' }
];

// Display the main page
app.get('/social', (req, res) => {
  
  res.render('pages/social', { layout:'main', posts: initialPosts });

});



// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');