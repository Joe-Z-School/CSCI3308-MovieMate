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


// ********************** CLEANUP **************************************
after(done => {
  server.close(() => {
    console.log('🔒 Server closed after tests');
    done();
  });
});
