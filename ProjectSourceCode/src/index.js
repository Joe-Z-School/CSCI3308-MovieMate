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
    // Get incoming follow requests
    const followRequests = await db.any(
      `SELECT fr.id AS request_id, u.username, u.profile_icon AS profile_pic, fr.requested_at
       FROM follow_requests fr
       JOIN users u ON u.id = fr.requester_id
       WHERE fr.receiver_id = $1 AND fr.status = 'pending'
       ORDER BY fr.requested_at DESC`,
      [userId]
    );

    // Get general notifications for the logged-in user
    const generalNotifications = await db.any(
      `SELECT n.id, n.message, u.username AS sender_username, u.profile_icon, n.created_at
       FROM notifications n
       JOIN users u ON u.id = n.sender_id
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );

    res.render('pages/notifications', {
      user: req.session.user,
      followRequests,
      generalNotifications
    });

  } catch (err) {
    console.error('Error loading notifications:', err.message);
    res.render('pages/notifications', {
      followRequests: [],
      generalNotifications: [],
      error: true,
      message: 'Something went wrong while loading notifications.'
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
      // 👇 Create notification for requester
      await t.none(
        `INSERT INTO notifications (recipient_id, sender_id, message)
         VALUES ($1, $2, $3)`,
        [request.requester_id, request.receiver_id, 'accepted your follow request']
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

//dismissing notifications:
app.post('/notifications/dismiss/:id', async (req, res) => {
  const notifId = parseInt(req.params.id);
  const userId = req.session.user.id;

  try {
    await db.none(
      `DELETE FROM notifications WHERE id = $1 AND recipient_id = $2`,
      [notifId, userId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to dismiss notification:', err.message);
    res.status(500).send('Error dismissing notification');
  }
});


// *****************************************************
// <!-- Post like and comments-->
// *****************************************************
// POST /api/posts/:id/like
//allows the user to like and unlike a post
app.post("/api/posts/:id/like", async (req, res) => {
  const userId = req.session.user?.id;
  const postId = parseInt(req.params.id);

  if (!userId || isNaN(postId)) {
    return res.status(400).json({ error: "Bad request" });
  }

  try {
    // Check if user already liked the post
    const alreadyLiked = await db.oneOrNone(
      "SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2",
      [userId, postId]
    );

    if (alreadyLiked) {
      // Unlike it
      await db.none(
        "DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );
      await db.none(
        "UPDATE posts SET like_count = like_count - 1 WHERE id = $1",
        [postId]
      );
      // Get updated like count
      const { like_count } = await db.one(
        "SELECT like_count FROM posts WHERE id = $1",
        [postId]
        );
        const action = "inliked";
  
      return res.json({ action, likeCount: like_count });
    } else {
      // Like it
      await db.none(
        "INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)",
        [userId, postId]
      );
      await db.none(
        "UPDATE posts SET like_count = like_count + 1 WHERE id = $1",
        [postId]
      );
      // 🔔 Create notification if the liker is not the post owner
        const postOwner = await db.oneOrNone("SELECT user_id FROM posts WHERE id = $1", [postId]);

        if (postOwner && postOwner.user_id !== userId) {
          await db.none(
            `INSERT INTO notifications (sender_id, recipient_id, message, created_at)
            VALUES ($1, $2, $3, NOW())`,
            [userId, postOwner.user_id, 'liked your post']
          );
        }
  
      
      // Get updated like count
      const { like_count } = await db.one(
      "SELECT like_count FROM posts WHERE id = $1",
      [postId]
      );
      const action = "liked";

    return res.json({ action, likeCount: like_count });
    }
  } catch (err) {
    console.error("Error in like route:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});



app.post("/api/posts/:id/comment", express.urlencoded({ extended: true }), async (req, res) => {
  const userId = req.session.user?.id;
  const postId = req.params.id;
  const comment = req.body.comment;

  console.log("📥 Incoming comment:", { userId, postId, comment });

  if (!userId || !comment) {
    return res.status(400).send("Missing user or comment");
  }

  try {
    await db.none(
      "INSERT INTO post_comments (user_id, post_id, comment) VALUES ($1, $2, $3)",
      [userId, postId, comment]
    );
    await db.none("UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1", [postId]);
    // 🔔 Create notification if the commenter is not the post owner
  const postOwner = await db.oneOrNone("SELECT user_id FROM posts WHERE id = $1", [postId]);

  if (postOwner && postOwner.user_id !== userId) {
    await db.none(
    `INSERT INTO notifications (sender_id, recipient_id, message, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, postOwner.user_id, `commented on your post: "${comment}"`]
  );
    }

    res.redirect("/social");
  } catch (err) {
    console.error("💥 Comment DB error:", err);
    res.status(500).send("Server error");
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
      { requester_id: 7, receiver_id: 11 },
      { requester_id: 8, receiver_id: 11 },
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
      { follower_id: 11, followed_id: 7 }, // YourUser → 
      { follower_id: 11, followed_id: 8 }, // Youruser → 
      { follower_id: 11, followed_id: 9 }, // YourUser → max_power
      { follower_id: 11, followed_id: 10 }, // Youruser → sara_sky
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


// Temporary dev route to insert test notifications
// Visit: http://localhost:3000/dev/create-notifications
app.get('/dev/create-notifications', async (req, res) => {
  try {
    const notifications = [
      {
        recipient_id: 11,
        sender_id: 2,
        message: 'max_power accepted your follow request.'
      },
      {
        recipient_id: 11,
        sender_id: 3,
        message: 'sara_sky commented on your post.'
      },
      {
        recipient_id: 11,
        sender_id: 5,
        message: 'jessie_writer started following you.'
      },
      {
        recipient_id: 11,
        sender_id: null,
        message: '🎉 Welcome to MovieMate!'
      }
    ];

    for (const notif of notifications) {
      await db.none(
        `INSERT INTO notifications (recipient_id, sender_id, message, created_at, is_read)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, FALSE)`,
        [notif.recipient_id, notif.sender_id, notif.message]
      );
    }

    res.send('Test notifications created successfully.');
  } catch (err) {
    console.error('Error inserting notifications:', err);
    res.status(500).send('Failed to create notifications.');
  }
});

// Visit: http://localhost:3000/dev/create-user-posts
app.get('/dev/create-user-posts', async (req, res) => {
  try {
    const postOwnerId = 11; // Must exist in your users table

    // 🔹 Step 1: Create test posts
    const postIds = [];
    const testPosts = [
      {
        title: "Inception",
        body: "Test body for Inception",
        cover: "https://image.tmdb.org/t/p/w500/poster1.jpg",
        where_to_watch: "Netflix",
        review: 4.5
      },
      {
        title: "The Matrix",
        body: "Test body for The Matrix",
        cover: "https://image.tmdb.org/t/p/w500/poster2.jpg",
        where_to_watch: "HBO Max",
        review: 4.8
      }
    ];

    for (const post of testPosts) {
      const inserted = await db.one(
        `INSERT INTO posts (title, body, user_id, cover, where_to_watch, review, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [post.title, post.body, postOwnerId, post.cover, post.where_to_watch, post.review]
      );
      postIds.push(inserted.id);
    }

    // 🔹 Step 2: Add likes + notifications
    const likerIds = [2, 3, 4];
    for (const postId of postIds) {
      for (const likerId of likerIds) {
        if (likerId !== postOwnerId) {
          await db.none(
            `INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [likerId, postId]
          );
          await db.none(
            `UPDATE posts SET like_count = like_count + 1 WHERE id = $1`,
            [postId]
          );
          await db.none(
            `INSERT INTO notifications (recipient_id, sender_id, message)
             VALUES ($1, $2, $3)`,
            [postOwnerId, likerId, 'liked your post']
          );
        }
      }
    }

    // 🔹 Step 3: Add comments + notifications
    const commenterIds = [3, 5];
    const sampleComments = ["Nice pick!", "One of my favorites!"];
    let i = 0;

    for (const postId of postIds) {
      for (const commenterId of commenterIds) {
        const commentText = sampleComments[i % sampleComments.length];
        i++;

        await db.none(
          `INSERT INTO post_comments (user_id, post_id, comment)
           VALUES ($1, $2, $3)`,
          [commenterId, postId, commentText]
        );
        await db.none(
          `UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`,
          [postId]
        );
        await db.none(
          `INSERT INTO notifications (recipient_id, sender_id, message)
           VALUES ($1, $2, $3)`,
          [postOwnerId, commenterId, `commented on your post: "${commentText}"`]
        );
      }
    }

    res.send(`✅ Created posts, likes, comments, and notifications for user ID ${postOwnerId}`);
  } catch (err) {
    console.error("❌ Error creating user posts:", err.message);
    console.error(err.stack);
    res.status(500).send("❌ Failed to create test data.");
  }
});






// *****************************************************
// <!-- Friends Posts -->
// *****************************************************
app.get('/social', async (req, res) => {
  const userId = req.session.user?.id;
  const limit = 5;
  const offset = 0; // first 5 posts

  try {
    const posts = await db.any(`
  SELECT 
    posts.id, 
    posts.title, 
    posts.body, 
    posts.cover, 
    posts.where_to_watch, 
    posts.review, 
    posts.like_count, 
    posts.comment_count,
    users.username AS user,
    EXISTS (
      SELECT 1 FROM post_likes 
      WHERE post_likes.user_id = $1 AND post_likes.post_id = posts.id
    ) AS liked
  FROM posts
  JOIN users ON posts.user_id = users.id
  JOIN friends ON friends.followed_user_id = posts.user_id
  WHERE friends.following_user_id = $1
  ORDER BY posts.created_at DESC
  LIMIT $2 OFFSET $3
`, [userId, limit, offset]);

    res.render('pages/social', { layout: 'main', user: req.session.user, posts });
  } catch (err) {
    console.error("Error loading initial posts:", err);
    res.status(500).send("Internal Server Error");
  }
});


app.get('/load-more', async (req, res) => {
  console.log("GET /load-more body:", req.body); // should be undefined or {}
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const userId = req.session.user?.id;

  try {
    const posts = await db.any(`
  SELECT 
    posts.id, 
    posts.title, 
    posts.body, 
    posts.cover, 
    posts.where_to_watch, 
    posts.review, 
    posts.like_count, 
    posts.comment_count,
    users.username AS user,
    EXISTS (
      SELECT 1 FROM post_likes 
      WHERE post_likes.user_id = $1 AND post_likes.post_id = posts.id
    ) AS liked
  FROM posts
  JOIN users ON posts.user_id = users.id
  JOIN friends ON friends.followed_user_id = posts.user_id
  WHERE friends.following_user_id = $1
  ORDER BY posts.created_at DESC
  LIMIT $2 OFFSET $3
`, [userId, limit, offset]);

    return res.json({ posts });
  } catch (err) {
    console.error("Error loading more posts:", err);
    res.status(500).json({ error: "Failed to load posts" });
  }
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
app.get('/profile', (req, res) => {
  const profileUsername = req.query.username || req.session.user.username;
  const loggedInUsername = req.session.user ? req.session.user.username : null;
  const isOwnProfile = loggedInUsername === profileUsername;

  res.render('pages/profile', {
    user: req.session.user,
    isOwnProfile: isOwnProfile
  });
});

app.get('/profile/edit', (req, res) => {
  const user = req.session.user;
  res.render('pages/profile-edit', {
    user: user
  });
})

app.post('/profile/edit', async (req, res) => {
  const userId = req.session.user.id;
  const { first_name, last_name, email, bio, profile_icon } = req.body;
  console.log(profile_icon)

  try {
    // Update database
    await db.none(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, bio = $4, profile_icon = $5
       WHERE id = $6`,
      [first_name, last_name, email, bio, profile_icon, userId]
    );

    // Create a new object with updated values instead of modifying the existing one
    const updatedUser = {
      ...req.session.user,
      first_name,
      last_name,
      email,
      bio,
      profile_icon: profile_icon || req.session.user.profile_icon
    };

    // Update session with the new object
    req.session.user = updatedUser;

    req.session.save(err => {
      if (err) {
        console.error('Error saving session:', err);
        return res.render('pages/profile-edit', {
          user: req.session.user,
          error: 'Failed to update profile. Please try again.'
        });
      }
      res.redirect('/profile');
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.render('pages/profile-edit', {
      user: req.session.user,
      error: 'Failed to update profile. Please try again.'
    });
  }
});

// Profile Followers/Following Routes
app.get('/profile/followers', async (req, res) => {
  const userId = req.query.userId || req.session.user.id;

  try {
    const followers = await db.any(`
          SELECT u.id, u.username, u.profile_icon, u.first_name, u.last_name, u.bio
          FROM friends f
          JOIN users u ON f.following_user_id = u.id
          WHERE f.followed_user_id = $1
      `, [userId]);

    res.render('pages/followers', {
      user: req.session.user,
      followers
    });
  } catch (err) {
    console.error('Error fetching followers:', err);
    res.status(500).send('Error loading followers');
  }
});

app.get('/profile/following', async (req, res) => {
  const userId = req.query.userId || req.session.user.id;

  try {
    const following = await db.any(`
          SELECT u.id, u.username, u.profile_icon, u.first_name, u.last_name, u.bio
          FROM friends f
          JOIN users u ON f.followed_user_id = u.id
          WHERE f.following_user_id = $1
      `, [userId]);

    res.render('pages/following', {
      user: req.session.user,
      following
    });
  } catch (err) {
    console.error('Error fetching following:', err);
    res.status(500).send('Error loading following');
  }
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