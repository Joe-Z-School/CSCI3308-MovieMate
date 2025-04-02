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

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
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
    //get the username
    const username = req.body.username;
    //get the user from the usernmae
    const getUser = `SELECT * FROM users WHERE users.username = $1`;
    //let response = await db.none(insert, [username, hash]);
    try{
        let user = await db.one(getUser, username);
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match){
            res.render('pages/login', {layout: 'main' , message: 'Incorrect username or password.'});
        }else{
            console.log('user logged in');
            req.session.user = user;
            req.session.save();
            res.redirect('/findFriends');
        }
    }catch (err){
        req.session.Message = 'An error occurred';
        res.redirect('/register');

    };
});
 

  app.get('/register', (req, res) => {
    //do something
    res.render('pages/register');
  });

// Register
app.post('/register', async (req, res) => {
    //hash the password using bcrypt library
    const hash = await bcrypt.hash(req.body.password, 10);

    const username = req.body.username;
    const email = req.body.email;
    const profile_icon = req.body.profile_icon;
    const bio = req.body.bio;

    // Generate a timestamp for when this request is made
    const created_at = new Date().toISOString();
    
    //creating insert
    const insert = `INSERT INTO users (username, password, email, profile_icon, bio, created_at, followers_count,following_count) VALUES( $1, $2, $3, $4, $5, $6,0,0)`;
    
    try{
        await db.none(insert, [username, hash, email, profile_icon, bio, created_at]);
        console.log('data successfully added');
        res.redirect('/login');
    }catch (err){
        req.session.Message = 'An error occurred';
        res.redirect('/register');
    };
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

app.get('/findFriends', async (req, res) => {
  const userId = req.session.user.id;
  
  try {
    const users = await db.any(
      `SELECT 
      u.id, u.username, u.profile_icon, u.bio,
      CASE 
        WHEN f.following_user_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS is_following
     FROM users u
     LEFT JOIN friends f 
       ON f.following_user_id = $1 AND f.followed_user_id = u.id
     WHERE u.id != $1
     ORDER BY u.username ASC`,
    [userId]
    );

    res.render('pages/findFriends', {
      email: req.session.user.email,
      users
    });

  } catch (err) {
    console.error('Error loading users:', err.message);
    res.render('pages/findFriends', {
      email: req.session.user.email,
      users: [],
      error: true,
      message: 'Something went wrong while loading users.'
    });
  }
});


app.post('/users/follow', async (req, res) => {
  const followerId = req.session.user.id;               // the logged-in user
  const followingId = parseInt(req.body.following_id);  // the user being followed
  const created_at = new Date().toISOString();

  try {
    await db.tx(async t => {
      // Try to insert into friends table
      const result = await t.result(
        `INSERT INTO friends (following_user_id, followed_user_id, friends_since)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [followerId, followingId, created_at]
      );

      if (result.rowCount > 0) {
        // Only update counts if a new row was inserted
        await t.none(
          `UPDATE users SET following_count = following_count + 1 WHERE id = $1`,
          [followerId]
        );

        await t.none(
          `UPDATE users SET followers_count = followers_count + 1 WHERE id = $1`,
          [followingId]
        );

        console.log(`${req.session.user.username} now follows user ${followingId}`);

      } else {
        console.log(`${req.session.user.username} already follows user ${followingId} — no count change`);
      }
    });

    res.redirect('/findFriends');

  } catch (err) {
    console.error('Error following user:', err.message);
    res.render('pages/findFriends', {
      users: [],
      error: true,
      message: 'Something went wrong while trying to follow this user.'
    });
  }
});



// Allowing Users to unfollow
app.post('/users/unfollow', async (req, res) => {
  const followerId = req.session.user.id;
  const followingId = parseInt(req.body.following_id);

  try {
    await db.tx(async t => {
      // Try to delete the relationship
      const result = await t.result(
        `DELETE FROM friends
         WHERE following_user_id = $1 AND followed_user_id = $2`,
        [followerId, followingId]
      );

      if (result.rowCount > 0) {
        // Only update counts if a row was actually deleted
        await t.none(
          `UPDATE users SET following_count = following_count - 1 WHERE id = $1`,
          [followerId]
        );

        await t.none(
          `UPDATE users SET followers_count = followers_count - 1 WHERE id = $1`,
          [followingId]
        );

        console.log(`${req.session.user.username} unfollowed user ${followingId}`);
      } else {
        console.log(`${req.session.user.username} was not following user ${followingId} — no count change`);
      }
    });

    res.redirect('/findFriends');

  } catch (err) {
    console.error('Error unfollowing user:', err.message);
    res.render('pages/findFriends', {
      users: [],
      error: true,
      message: 'Something went wrong while trying to unfollow this user.'
    });
  }
});


// *****************************************************
// <!-- Logout -->
// *****************************************************
//To log out
app.get('/logout', (req, res) => {
  console.log("succesfully logged out");
  req.session.destroy(function(err) {
    res.render('pages/login', {message : 'Logged out Successfully'});
  });
});

// *****************************************************
// <!-- Friends Posts -->
// *****************************************************

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
  const initialPosts = posts.slice(0, 5); // Load the first 5 posts
  res.render('pages/social', { layout:'main', posts: initialPosts });
});

// Load paginated posts
app.get('/load-more', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = 5; // Number of posts per batch
  const startIndex = (page - 1) * limit;
  const paginatedPosts = posts.slice(startIndex, startIndex + limit);

  res.json({ posts: paginatedPosts });
});

// Temporary in-memory storage for the watchlist
app.post('/add-to-watchlist', async (req, res) => {
  const { title, picture, whereToWatch } = req.body;

  if (!title || !picture || !whereToWatch) {
    res.render('pages/social', { layout: 'main', message: 'Incomplete movie information.', status: 400 });
    return; 
  }

  db.tx(async insert => {
    // Remove the course from the student's list of courses.
    await insert.query('INSERT INTO watchlist (title, picture, whereToWatch) VALUES ($1, $2, $3)', [title, picture, whereToWatch]);
  }).then(social => {
      res.render('pages/social', {layout: 'main', success: true, message: `Successfully added ${title} to your watchlist.`});
    }).catch(err => {
      res.render('pages/social', {layout: 'main', error: true, message: 'Failed to add movie to watchlist.'});
    }); 
  
});

app.post('/remove-from-watchlist', async (req, res) => {
  const title = req.body.title;

  if (!title) {
    res.render('pages/social', { layout: 'Main', message: 'Movie title is required', status: 400});
    return;
  }

  db.tx(async remove => {
    // Remove the course from the student's list of courses.
    await remove.none('DELETE FROM watchlist WHERE title = $1;', [title]);
  }).then(social => {
      res.render('pages/social', {layout: 'main', success: true, message: `Successfully removed ${title} from your watchlist.`});
    }).catch(err => {
      res.render('pages/social', {layout: 'main', error: true, message: 'Failed to remove movie from watchlist.'});
    });  
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');