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
const movieController = require('./controllers/movieController'); // To handle movie-related API requests


// *****************************************************
// <!-- Socket.IO Server Creation -->
// *****************************************************
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server); // Attach Socket.IO to the server

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

Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

const user = {
  username: undefined,
  password: undefined
};

// OMDB API Routes
app.get('/api/movies/search', movieController.searchMovies);
app.get('/api/movies/details/:imdbId', movieController.getMovieDetails);
app.post('/api/movies/watchlist', movieController.addToWatchlist);
app.post('/api/movies/watched', movieController.markAsWatched);
app.post('/api/movies/review', movieController.addReview);
app.get('/api/movies/reviews/:imdbId', movieController.getMovieReviews);
app.get('/api/movies/new', movieController.getNewMovies);

// New routes for the enhanced explore page
app.get('/api/movies/filter', movieController.filterMovies);
app.get('/api/movies/trending', movieController.getTrendingMovies);
app.get('/api/placeholder/:width/:height', movieController.getPlaceholderImage);

// Page Routes
app.get('/movies/details/:imdbId', (req, res) => {
  res.render('pages/movie-details', {
    imdbId: req.params.imdbId,
    user: req.session.user
  });
});

app.get('/explore', (req, res) => {
  res.render('pages/explore', {
    user: req.session.user,
    title: 'Explore Movies - MovieMates'
  });

});

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
  try {
    let user = await db.one(getUser, username);
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      res.render('pages/login', { layout: 'main', message: 'Incorrect username or password.' });
    } else {
      console.log('user logged in');
      req.session.user = user;
      req.session.save();
      res.redirect('/findFriends');
    }
  } catch (err) {
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
  console.log('Generated Hash:', hash);

  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const username = req.body.username;
  const email = req.body.email;
  const profile_icon = req.body.profile_icon;
  const bio = req.body.bio;

  // Generate a timestamp for when this request is made
  const created_at = new Date().toISOString();

  //creating insert
  const insert = `INSERT INTO users (username, password, email, profile_icon, bio, created_at, first_name, last_name) VALUES( $1, $2, $3, $4, $5, $6, $7, $8)`;

  try {
    await db.none(insert, [username, hash, email, profile_icon, bio, created_at, first_name, last_name]);
    console.log('data successfully added');
    res.redirect('/login');
  } catch (err) {
    req.session.Message = 'An error occurred';
    res.redirect('/register');
  };
});

// Development route for messaging tests
app.get('/dev/register', async (req, res) => {
  //hash the password using bcrypt library
  
    const accounts = [
      { first_name: 'joe1',
        last_name: 'joe1',
        username: 'joe1',
        email: 'joe1@email.com',
        profile_icon: 'Profile_pic_option_1.png',
        bio: 'joe1'
      },
      { first_name: 'joe2',
        last_name: 'joe2',
        username: 'joe2',
        email: 'joe2@email.com',
        profile_icon: 'profile_pic_option_6.png',
        bio: 'joe2'
      },
      { first_name: 'joe3',
        last_name: 'joe3',
        username: 'joe3',
        email: 'joe3@email.com',
        profile_icon: 'profile_pic_option_2.png',
        bio: 'joe3'
      },
      { first_name: 'joe4',
        last_name: 'joe4',
        username: 'joe4',
        email: 'joe4@email.com',
        profile_icon: 'profile_pic_option_5.png',
        bio: 'joe4'
      },
    ]
    // Generate a timestamp for when this request is made
    const created_at = new Date().toISOString();
    const hash = await bcrypt.hash('joe', 10);
    try{
    //creating insert
    for (const sets of accounts) {
      await db.tx(async t => {
        await t.none(`
          INSERT INTO users (username, password, email, profile_icon, bio, created_at, first_name, last_name) 
          VALUES( $1, $2, $3, $4, $5, $6, $7, $8)
          `, [sets.username, hash, sets.email, sets.profile_icon, sets.bio, created_at, sets.first_name, sets.last_name]);
      });
    }
    res.send('data successfully added');
  } catch (err) {
    req.session.Message = 'An error occurred';
    res.send('Error adding data');
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

// *****************************************************
// <!-- User Following/Followes -->
// *****************************************************
app.get('/findFriends', async (req, res) => {
  const userId = req.session.user.id;


  try {
    const users = await db.any(
      `
      SELECT 
        u.id,
        u.username,
        u.profile_icon,
        u.bio,
        u.first_name, 
        u.last_name,
        CASE 
          WHEN f.following_user_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS is_following,
        CASE 
          WHEN fr.status = 'pending' THEN TRUE
          ELSE FALSE
        END AS is_requested
      FROM users u
      LEFT JOIN friends f 
        ON f.following_user_id = $1 AND f.followed_user_id = u.id
      LEFT JOIN follow_requests fr
        ON fr.requester_id = $1 AND fr.receiver_id = u.id
      WHERE u.id != $1
      ORDER BY u.username ASC
      `,
      [userId]
    );

    res.render('pages/findFriends', {
      user: req.session.user,
      users
    });

  } catch (err) {
    console.error('Error loading users:', err.message);
    res.render('pages/findFriends', {
      user: req.session.user,
      users: [],
      error: true,
      message: 'Something went wrong while loading users.'
    });
  }
});
//Allowing the user to follow others
app.post('/users/follow', async (req, res) => {
  const requesterId = req.session.user.id;
  const receiverId = parseInt(req.body.following_id);
  const requestedAt = new Date().toISOString();

  try {
    await db.none(
      `INSERT INTO follow_requests (requester_id, receiver_id, status, requested_at)
       VALUES ($1, $2, 'pending', $3)
       ON CONFLICT DO NOTHING`, // prevent duplicates
      [requesterId, receiverId, requestedAt]
    );

    console.log(`Follow request sent from ${requesterId} to ${receiverId}`);
    res.redirect('/findFriends');
  } catch (err) {
    console.error('Error sending follow request:', err.message);
    res.status(500).send('Internal server error');
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
      user: req.session.user,
      users: [],
      error: true,
      message: 'Something went wrong while trying to unfollow this user.'
    });
  }

});

//to unsend a follow request
app.post('/users/cancel-request', async (req, res) => {
  const requesterId = req.session.user.id;
  const receiverId = parseInt(req.body.receiver_id);

  try {
    await db.result(
      `DELETE FROM follow_requests
       WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [requesterId, receiverId]
    );

    console.log(`User ${requesterId} canceled follow request to ${receiverId}`);
    res.redirect('/findFriends');
  } catch (err) {
    console.error('Error cancelling follow request:', err.message);
    res.status(500).send('Error cancelling request');
  }
});

// *****************************************************
// <!--Notifications -->
// *****************************************************
app.get('/notifications', async (req, res) => {
  const userId = req.session.user.id;

  try {
    const followRequests = await db.any(
      `SELECT fr.id AS request_id, u.username, u.profile_icon AS profile_pic, fr.requested_at
       FROM follow_requests fr
       JOIN users u ON u.id = fr.requester_id
       WHERE fr.receiver_id = $1 AND fr.status = 'pending'
       ORDER BY fr.requested_at DESC`,
      [userId]
    );

    res.render('pages/notifications', {
      user: req.session.user,
      followRequests
    });

  } catch (err) {
    console.error('Error loading follow requests:', err.message);
    res.render('pages/notifications', {
      followRequests: [],
      error: true,
      message: 'Something went wrong while loading requests.'
    });
  }
});


// *****************************************************
// <!-- Logout -->
// *****************************************************
//To log out
app.get('/logout', (req, res) => {
  console.log("succesfully logged out");
  req.session.destroy(function (err) {
    res.render('pages/login', { message: 'Logged out Successfully' });
  });
});

app.post('/follow-request/approve/:id', async (req, res) => {
  const requestId = parseInt(req.params.id);

  try {
    const request = await db.one(
      `SELECT requester_id, receiver_id FROM follow_requests WHERE id = $1`,
      [requestId]
    );

    await db.tx(async t => {
      await t.none(
        `UPDATE follow_requests SET status = 'approved' WHERE id = $1`,
        [requestId]
      );

      await t.none(
        `INSERT INTO friends (following_user_id, followed_user_id, friends_since)
         VALUES ($1, $2, NOW())`,
        [request.requester_id, request.receiver_id]
      );

      await t.none(
        `UPDATE users SET following_count = following_count + 1 WHERE id = $1`,
        [request.requester_id]
      );

      await t.none(
        `UPDATE users SET followers_count = followers_count + 1 WHERE id = $1`,
        [request.receiver_id]
      );
    });

    res.redirect('/notifications#requests'); // Redirect back to notifications after approval
  } catch (err) {
    console.error('Error approving follow request:', err.message);
    res.status(500).send('Something went wrong.');
  }
});

app.post('/follow-request/decline/:id', async (req, res) => {
  const requestId = parseInt(req.params.id);

  try {
    await db.result(
      `DELETE FROM follow_requests WHERE id = $1`,
      [requestId]
    );

    res.redirect('/notifications#requests');
  } catch (err) {
    console.error('Error declining follow request:', err.message);
    res.status(500).send('Something went wrong.');
  }
});

// *****************************************************
// <!-- Data base info to add for testing-->
// *****************************************************
/* Temporary way to add request data and to add friend data for your user account*/
//just visit: http://localhost:3000/dev/create-follow-requests
app.get('/dev/create-follow-requests', async (req, res) => {
  try {
    const requests = [
      { requester_id: 2, receiver_id: 11 },
      { requester_id: 3, receiver_id: 11 },
      { requester_id: 4, receiver_id: 11 },
      { requester_id: 5, receiver_id: 11 },
      { requester_id: 6, receiver_id: 11 }
    ];

    for (const reqData of requests) {
      await db.none(
        `INSERT INTO follow_requests (requester_id, receiver_id, status, requested_at)
         VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)`,
        [reqData.requester_id, reqData.receiver_id]
      );
    }

    res.send('Test follow requests created.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create test follow requests.');
  }
});

/* Temporary way to add test friends */
//just visit: http://localhost:3000/dev/create-friends
app.get('/dev/create-friends', async (req, res) => {
  try {
    const friends = [
      { follower_id: 11, followed_id: 2 }, // YourUser → max_power
      { follower_id: 11, followed_id: 3 }, // Youruser → sara_sky
      { follower_id: 4, followed_id: 11 }, // code_matt → yourUser
      { follower_id: 5, followed_id: 11 }, // jessie_writer → yourUser
      { follower_id: 11, followed_id: 12 }, // joe1 → joe2
      { follower_id: 11, followed_id: 13 }, // joe1 → joe3
      { follower_id: 11, followed_id: 14 }, // joe1 → joe4
      { follower_id: 11, followed_id: 4 }, // joe1 → matt
      { follower_id: 11, followed_id: 5 }, // joe1 → jessie
      { follower_id: 11, followed_id: 6 }, // joe1 → kay
    ];

    for (const pair of friends) {
      await db.tx(async t => {
        await t.none(
          `INSERT INTO friends (following_user_id, followed_user_id, friends_since)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [pair.follower_id, pair.followed_id]
        );

        await t.none(
          `UPDATE users SET following_count = following_count + 1 WHERE id = $1`,
          [pair.follower_id]
        );

        await t.none(
          `UPDATE users SET followers_count = followers_count + 1 WHERE id = $1`,
          [pair.followed_id]
        );
      });
    }

    res.send('Test friendships created.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create test friendships.');
  }
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
  res.render('pages/social', { layout: 'main', user: req.session.user, posts: initialPosts });
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
    res.render('pages/social', { layout: 'main', success: true, message: `Successfully added ${title} to your watchlist.` });
  }).catch(err => {
    res.render('pages/social', { layout: 'main', error: true, message: 'Failed to add movie to watchlist.' });
  });

});

app.post('/remove-from-watchlist', async (req, res) => {
  const title = req.body.title;

  if (!title) {
    res.render('pages/social', { layout: 'Main', message: 'Movie title is required', status: 400 });
    return;
  }

  db.tx(async remove => {
    // Remove the course from the student's list of courses.
    await remove.none('DELETE FROM watchlist WHERE title = $1;', [title]);
  }).then(social => {
    res.render('pages/social', { layout: 'main', success: true, message: `Successfully removed ${title} from your watchlist.` });
  }).catch(err => {
    res.render('pages/social', { layout: 'main', error: true, message: 'Failed to remove movie from watchlist.' });
  });
});

// *****************************************************
//  <!-- Profile Page --!>
// *****************************************************
// Display the main page
// If you want to use the current route format (no username in URL)
app.get('/profile', (req, res) => {
  const profileUsername = req.query.username || req.session.user.username;
  const loggedInUsername = req.session.user ? req.session.user.username : null;
  const isOwnProfile = loggedInUsername === profileUsername;

  res.render('pages/profile', {
    user: req.session.user,
    isOwnProfile: isOwnProfile
  });
});

// *****************************************************
// <!-- Messages Page -->
// *****************************************************

const { formatDistanceToNow } = require('date-fns');

app.get('/messaging', async (req, res) => {
  try {
    const activeUser = {
      id: req.session.user?.id,
      name: req.session.user?.first_name,
      profile_icon: req.session.user?.profile_icon,
    };

    if (!activeUser.id) {
      console.error('Active User not found in session.');
      return res.status(400).send('User session is invalid.');
    }

    const allFriendsQuery = `
      SELECT DISTINCT ON (u.id)
             u.id, u.username AS name, u.profile_icon,
             f.latest_message,
             f.last_active,
             f.unread_count
        FROM friends f
        JOIN users u ON (
             (u.id = f.followed_user_id AND f.following_user_id = $1)
          OR (u.id = f.following_user_id AND f.followed_user_id = $1)
        )
       WHERE u.id != $1;
    `;
    const allFriends = await db.query(allFriendsQuery, [activeUser.id]);

    const formattedFriends = allFriends.map(friend => ({
      id: friend.id,
      name: friend.name,
      profile_icon: friend.profile_icon,
      latest_message: friend.latest_message,
      unread_count: friend.unread_count ?? 0,
      last_active: friend.last_active
        ? formatDistanceToNow(new Date(friend.last_active), { addSuffix: true })
        : "Not available"
    }));
    

    res.render('pages/messaging', {
      activeUser,
      allFriends: formattedFriends,
    });
  } catch (error) {
    console.error('Error loading messaging page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Store which users are currrently chatting
const activeChats = new Map(); // Stores { userId: chattingWithUserId }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  

  // Fetch friends list for a user
  socket.on('get-friends-list', async ({ userId }) => {
    try {
      const query = `
        SELECT f.followed_user_id AS id, u.username AS name, u.profile_icon, 
               f.latest_message, f.unread_count, f.last_active
          FROM friends f
          JOIN users u ON u.id = f.followed_user_id
          WHERE f.following_user_id = $1
      `;
  
      const result = await db.query(query, [userId]);
      // console.log('Query Result:', result); // Show result of query
  
      const friendsList = result;
  
      if (!friendsList || friendsList.length === 0) {
        console.error('No friends found for user:', userId);
        socket.emit('friends-list-updated', []); // Send empty array if no friends found
        return;
      }
  
      // Send the updated friends list
      socket.emit('friends-list-updated', friendsList);
      // console.log('Updated friends list:', friendsList);
    } catch (error) {
      console.error('Failed to fetch friends list:', error);
      socket.emit('friends-list-updated', []); // Send empty array if error
    }
  });  

  // Join room for the current user
  socket.on('join-room', async ({ senderId, recipientId }) => {
    socket.join(`user-${senderId}`);
    socket.join(`user-${recipientId}`);
  
    // Track the active chat
    activeChats.set(senderId, recipientId);
  
    try {
      const query = `
        SELECT sender_id, recipient_id, content, timestamp
          FROM messages
          WHERE (sender_id = $1 AND recipient_id = $2)
             OR (sender_id = $2 AND recipient_id = $1)
          ORDER BY timestamp ASC
      `;
      const result = await db.query(query, [senderId, recipientId]);
  
      socket.emit('load-messages', result);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  });

  // Handle private messages
  socket.on('private-message', async ({ senderId, recipientId, content }) => {
    try {
      console.log('Private message received:', { senderId, recipientId, content });
  
      // Determine if the recipient is actively chatting with the sender
      const recipientActiveChat = activeChats.get(recipientId);
      const isChatOpen = recipientActiveChat === senderId;
  
      // Insert the message into the database
      const insertQuery = `
        INSERT INTO messages (sender_id, recipient_id, content, is_read, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await db.query(insertQuery, [senderId, recipientId, content, isChatOpen]);

      console.log(`Recipient's active chat:`, recipientActiveChat);
      console.log(`SenderId:`, senderId);
      console.log(`Chat open?`, isChatOpen);

  
      if (!isChatOpen) {
        // If chat is not open, increment unread count
        const updateUnread = `
          UPDATE friends
          SET latest_message = $1,
              last_active = NOW(),
              unread_count = unread_count + 1
          WHERE following_user_id = $2 AND followed_user_id = $3
        `;
        await db.query(updateUnread, [content, recipientId, senderId]);
  
        // Send updated unread count (optional)
        const unreadQuery = `SELECT unread_count FROM friends WHERE following_user_id = $1 AND followed_user_id = $2`;
        const { rows } = await db.query(unreadQuery, [recipientId, senderId]);
        const unreadCount = rows[0]?.unread_count || 0;
  
        io.to(`user-${recipientId}`).emit('update-unread-count', { senderId, recipientId, unreadCount });
        io.to(`user-${recipientId}`).emit('increment-unread', { from: senderId });
      } else {
        // Chat is open — mark all messages as read immediately
        const markRead = `
          UPDATE messages
          SET is_read = true
          WHERE recipient_id = $1 AND sender_id = $2
        `;
        await db.query(markRead, [recipientId, senderId]);
  
        // Reset unread count
        const resetUnread = `
          UPDATE friends
          SET unread_count = 0,
              latest_message = $1,
              last_active = NOW()
          WHERE following_user_id = $2 AND followed_user_id = $3
        `;
        await db.query(resetUnread, [content, recipientId, senderId]);
  
        // Notify UI to clear unread badge
        io.to(`user-${recipientId}`).emit('update-unread-count', { senderId, recipientId, unreadCount: 0 });
      }
  
      // Send the message to the recipient
      io.to(`user-${recipientId}`).emit('private-message', { senderId, content });
      
  
    } catch (error) {
      console.error('Error handling private message:', error);
    }
  });
  
  

// Mark messages as read
socket.on('mark-messages-read', async ({ senderId, recipientId }) => {
  try {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE recipient_id = $1 AND sender_id = $2;
    `;
    await db.query(query, [recipientId, senderId]);

    // Reset unread count
    const resetUnreadCountQuery = `
      UPDATE friends
      SET unread_count = 0
      WHERE following_user_id = $2 AND followed_user_id = $1;
    `;
    await db.query(resetUnreadCountQuery, [recipientId, senderId]);

    // Update unread count to 0
    socket.emit('update-unread-count', { senderId, recipientId, unreadCount: 0 });
    console.log(`Unread count reset for senderId: ${senderId}, recipientId: ${recipientId}`);
    activeChats.delete(senderId); // Optionally clear it when chat ends (if you track closing)

  } catch (error) {
    console.error('Failed to mark messages as read:', error);
  }
});

// Set active chat
socket.on('setActiveChat', (chatPartnerId) => {
  const currentUserId = [...activeChats.entries()].find(([key, value]) => value === chatPartnerId)?.[0];
  if (chatPartnerId === null) {
    // User left the chat — clear from map
    activeChats.delete(currentUserId);
    console.log(`Cleared active chat for user ${currentUserId}`);
  } else {
    // Set new active chat
    activeChats.set(currentUserId, chatPartnerId);
    console.log(`User ${currentUserId} is now chatting with ${chatPartnerId}`);
  }
});


  // User disconnect handler
  socket.on('disconnect', () => {
    for (let userId in activeChats) {
      if (socket.id === `user-${userId}`) {
        delete activeChats[userId];
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});



// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});