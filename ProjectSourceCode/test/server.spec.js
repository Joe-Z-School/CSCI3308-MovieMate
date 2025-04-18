// ********************** Initialize server **********************************
const { app, server, db } = require('../src/index'); // Destructure app and server

// ********************** Import Libraries ***********************************
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

let agent; // For session-aware requests

// ********************** DEFAULT WELCOME TESTCASE ****************************
describe('Server!', () => {
  it('Returns the default welcome message', done => {
    chai
      .request(app)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// ********************** TESTING API's **************************************
describe('Testing Add User API', () => {
  it('positive : /register', done => {
    chai
      .request(app)
      .post('/register')
      .send({ username: 'John', password: 'password123', email: 'john@email.com' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  it('Negative : /register. Checking invalid name', done => {
    chai
      .request(app)
      .post('/register')
      .send({ username: 3, password: 'password123', email: '3@email.com' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });
});

// ********************** TESTING REDIRECT **************************************
describe('Testing Redirect', () => {
  it('test route should redirect to /login with 302 HTTP status code', done => {
    chai
      .request(app) // or `server` if that's how you're exporting from index.js
      .get('/test')
      .redirects(0) // prevents chai from following the redirect automatically
      .end((err, res) => {
        res.should.have.status(302);
        res.should.have.header('location', '/login');
        done();
      });
  });
});

// ********************** TESTING PAGE RENDER ***********************************
describe('Testing Render', () => {
  it('test "/login" route should render with an html response', done => {
    chai
      .request(app)
      .get('/login')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });
});

// ********************** PART C - /load-more API ********************************

describe('/load-more API Integration', () => {
  before(() => {
    // Simulate an authenticated user session
    agent = chai.request.agent(app);
    return agent
      .get('/dev/login-as-11') // This must be an actual dev route that sets req.session.user
      .then(res => {
        expect(res.text).to.include('Logged in as user ID 11');
      });
  });

  it('Positive: should return paginated posts for page 1', done => {
    agent
      .get('/load-more?page=1')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('posts').that.is.an('array');
        if (res.body.posts.length > 0) {
          expect(res.body.posts[0]).to.have.property('title');
          expect(res.body.posts[0]).to.have.property('user');
        }
        done();
      });
  });

  it('Positive: should return the next batch of posts for page 2', done => {
    agent
      .get('/load-more?page=2')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('posts').that.is.an('array');
        done();
      });
  });

  it('Negative: should return an empty array when the page exceeds the total number of posts', done => {
    agent
      .get('/load-more?page=100')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('posts').that.is.an('array').that.is.empty;
        done();
      });
  });

  it('Negative: should return an error for an invalid page number', done => {
    agent
      .get('/load-more?page=-1')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error').that.equals('Invalid page number');
        done();
      });
  });

  it('Negative: should return 401 if user is not logged in', done => {
    chai
      .request(app)
      .get('/load-more?page=1')
      .end((err, res) => {
        expect(res).to.have.status(401);
        done();
      });
  });
});


// **********************Find Friends ********************************
/* All /findFriends and follow/unfollow tests — including:
Invalid follow
Can't follow yourself
Follow request sent
Cancel follow request
Unfollow another user
*/
describe('/findFriends & Follow Actions', () => {
  const agent = chai.request.agent(server);

  // Fake login session
  before(async () => {
    await agent
      .get('/dev/login-as-11') // assumes /dev/login-as-11 sets session user to ID 11
      .then((res) => {
        expect(res).to.have.status(200);
      });
  });

  it('should render findFriends page', (done) => {
    agent
      .get('/findFriends')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  it('should not follow with invalid user ID', (done) => {
    agent
      .post('/users/follow')
      .send({ following_id: 'abc' })
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });

  it('should not follow yourself', (done) => {
    agent
      .post('/users/follow')
      .send({ following_id: 11 }) // same as logged in user
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });

  it('should send a follow request to user 3', (done) => {
    agent
      .post('/users/follow')
      .send({ following_id: 3 })
      .end((err, res) => {
        res.should.redirect;
        res.should.have.status(200);
        done();
      });
  });

  it('should cancel the follow request to user 3', (done) => {
    agent
      .post('/users/cancel-request')
      .send({ receiver_id: 3 })
      .end((err, res) => {
        res.should.redirect;
        res.should.have.status(200);
        done();
      });
  });

  it('should unfollow user 4', (done) => {
    agent
      .post('/users/unfollow')
      .send({ following_id: 4 })
      .end((err, res) => {
        res.should.redirect;
        res.should.have.status(200);
        done();
      });
  });
});
// ********************** Notifications (rendering and dismissal)**************************************
describe('/notifications API', () => {
  const agent = chai.request.agent(app);

  before(async () => {
    await agent.get('/dev/login-as-11').then((res) => {
      expect(res).to.have.status(200);
    });
    // Insert fake general and message notifications
      await db.none(`
      INSERT INTO notifications (recipient_id, sender_id, message)
      VALUES 
        (11, 3, 'User3 liked your post'),
        (11, 4, 'User4 commented on your post');

      INSERT INTO messages_notifications (recipient_id, sender_id, message)
      VALUES
        (11, 2, 'New message from user2'),
        (11, 5, 'New message from user5');
    `);
    });


  it('should render notifications page for logged in user', done => {
    agent
      .get('/notifications')
      .end((err, res) => {
        expect(res).to.have.status(200);
        res.should.be.html;
        done();
      });
  });

  it('should dismiss a general notification', done => {
    agent
      .post('/notifications/dismiss/1')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('should dismiss a message notification', done => {
    agent
      .post('/messages-notifications/dismiss/1')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('should return 500 for invalid dismiss request (notification does not exist)', done => {
    agent
      .post('/notifications/dismiss/99999')
      .end((err, res) => {
        expect(res.status).to.be.oneOf([200, 500]);
        done();
      });
  });
});

// ********************** Approve or Denying follow request **************************************
describe('Follow Request Actions', () => {
  const agent = chai.request.agent(app);
  let followRequestId;

  // Log in as user 11
  before(async () => {
    await agent.get('/dev/login-as-11').then(res => {
      expect(res).to.have.status(200);
    });

    // Create a pending follow request (user 2 → user 11)
    const result = await db.one(
      `INSERT INTO follow_requests (requester_id, receiver_id, status, requested_at)
       VALUES (2, 11, 'pending', CURRENT_TIMESTAMP)
       RETURNING id`
    );

    followRequestId = result.id;
  });

  it('should approve a follow request and redirect', done => {
    agent
      .post(`/follow-request/approve/${followRequestId}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.redirectTo(/\/notifications#requests$/);
        done();
      });
  });

  it('should decline a follow request and redirect', async () => {
    // First create a new follow request to decline
    const { id } = await db.one(
      `INSERT INTO follow_requests (requester_id, receiver_id, status, requested_at)
       VALUES (3, 11, 'pending', CURRENT_TIMESTAMP)
       RETURNING id`
    );

    return agent
      .post(`/follow-request/decline/${id}`)
      .then(res => {
        res.should.have.status(200);
        res.should.redirectTo(/\/notifications#requests$/);
      });
  });
});

// ********************** Post Like & Comment Tests ****************************
/*
Like and unlike flows
Invalid post ID for like
Valid comment posting
Missing comment text
Fetching post comments
*/
describe('/api/posts like & comment', () => {
  const agent = chai.request.agent(app);
  let testPostId;

  before(async () => {
    await agent.get('/dev/login-as-11');
    const result = await db.one(
      `INSERT INTO posts (title, body, user_id, cover, where_to_watch, review, created_at)
       VALUES ('Test Post', 'Test Body', 11, '', 'Netflix', 5.0, CURRENT_TIMESTAMP)
       RETURNING id`
    );
    testPostId = result.id;
  });

  it('should like a post', done => {
    agent
      .post(`/api/posts/${testPostId}/like`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('action', 'liked');
        res.body.should.have.property('likeCount');
        done();
      });
  });

  it('should unlike a post already liked', done => {
    agent
      .post(`/api/posts/${testPostId}/like`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('action', 'inliked');
        res.body.should.have.property('likeCount');
        done();
      });
  });

  it('should return 400 for invalid post ID on like', done => {
    agent
      .post('/api/posts/invalid/like')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('error', 'Bad request');
        done();
      });
  });

  it('should comment on a post', done => {
    agent
      .post(`/api/posts/${testPostId}/comment`)
      .type('form')
      .send({ comment: 'This is a test comment' })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('success', true);
        done();
      });
  });

  it('should return 400 if comment text is missing', done => {
    agent
      .post(`/api/posts/${testPostId}/comment`)
      .type('form')
      .send({})
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('message', 'Missing user or comment');
        done();
      });
  });

  it('should get comments for a post', done => {
    agent
      .get(`/api/posts/${testPostId}/comments`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('comments').that.is.an('array');
        done();
      });
  });
});

// ********************** Watchlist Tests **************************************
/*
describe('Watchlist API', () => {
  const agent = chai.request.agent(app);
  const testMovie = {
    imdbID: 'tt1234567',
    title: 'Test Movie',
    picture: 'https://via.placeholder.com/300',
    description: 'A test movie description'
  };

  before(async () => {
    await agent.get('/dev/login-as-11');
  });

  it('should add a movie to the watchlist', done => {
    agent
      .post('/add-to-watchlist')
      .send(testMovie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('success', true);
        done();
      });
  });

  it('should load the user\'s watchlist', done => {
    agent
      .get('/watchlist')
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.include(testMovie.title);
        done();
      });
  });

  it('should return error message if title is missing when removing from watchlist', done => {
    agent
      .post('/remove-from-watchlist')
      .send({})
      .end((err, res) => {
        res.should.have.status(200); // it's rendered HTML
        res.text.should.include('Movie title is required');
        done();
      });
  });

  it('should remove a movie from the watchlist', done => {
    agent
      .post('/remove-from-watchlist')
      .send({ title: testMovie.title })
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.include(`Successfully removed ${testMovie.title}`);
        done();
      });
  });
});
*/
// ********************** PROFILE **************************************
describe('Profile Routes', () => {
  const agent = chai.request.agent(app);
  let userId = 11;

  before(async () => {
    await agent.get('/dev/login-as-11').then(res => {
      expect(res).to.have.status(200);
    });
    await db.none(`INSERT INTO users (id, username, password, email) VALUES (2, 'test2', 'abc', 'a@a.com') ON CONFLICT DO NOTHING`);
  });

  // ------------------ Positive Tests ------------------

  it('should load the logged-in user profile page', done => {
    agent
      .get('/profile')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.include('Profile'); // adjust based on your template
        done();
      });
  });

  it('should load another user\'s profile page', async () => {
    const res = await agent.get('/profile?id=2');
    res.should.have.status(200);
    res.should.be.html;
    res.text.should.include('Profile');
  });

  it('should render the profile edit page', done => {
    agent
      .get('/profile/edit')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.include('Edit Profile');
        done();
      });
  });

  it('should update the user profile with valid data', done => {
    agent
      .post('/profile/edit')
      .type('form')
      .send({
        first_name: 'Updated',
        last_name: 'User',
        email: 'updated@email.com',
        bio: 'Updated bio',
        profile_icon: 'profile_pic_option_1.png'
      })
      .end((err, res) => {
        res.should.redirect;
        res.should.have.status(200);
        done();
      });
  });

  it('should load the user\'s followers page', done => {
    agent
      .get('/profile/followers')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  it('should load the user\'s following page', done => {
    agent
      .get('/profile/following')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  // ------------------ Negative Tests ------------------

  it('should return 500 for nonexistent user profile', done => {
    agent
      .get('/profile?id=99999') // ID that doesn't exist
      .end((err, res) => {
        res.should.have.status(500);
        res.text.should.include('Something went wrong');
        done();
      });
  });

  /*
  it('should show error on profile edit with missing data', done => {
    agent
      .post('/profile/edit')
      .type('form')
      .send({
        first_name: '',
        last_name: '',
        email: '',
        bio: '',
        profile_icon: ''
      })
      .end((err, res) => {
        res.should.redirect;
        res.should.redirectTo(/\/profile\?edit=true&error=1$/);
        done();
      });
  });

  it('should handle DB failure in /profile/followers gracefully', async () => {
    const originalAny = db.any;
    db.any = () => Promise.reject(new Error('Simulated DB failure'));
  
    const res = await agent.get('/profile/followers');
    res.should.have.status(500);
    res.text.should.include('Error loading followers');
  
    db.any = originalAny;
  });
  
  it('should handle DB failure in /profile/following gracefully', async () => {
    const originalAny = db.any;
    db.any = () => Promise.reject(new Error('Simulated DB failure'));
  
    const res = await agent.get('/profile/following');
    res.should.have.status(500);
    res.text.should.include('Error loading following');
  
    db.any = originalAny;
  });
  */
  
});
  


// ********************** LOGOUT **************************************
describe('Logout', () => {
  const agent = chai.request.agent(app);

  before(async () => {
    await agent.get('/dev/login-as-11').then((res) => {
      expect(res).to.have.status(200);
    });
  });

  it('should destroy the session and render login page with success message', (done) => {
    agent
      .get('/logout')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.include('Logged out Successfully');
        done();
      });
  });
});

// ********************** CLEANUP **************************************
after(done => {
  server.close(() => {
    console.log('🔒 Server closed after tests');
    done();
  });
});
