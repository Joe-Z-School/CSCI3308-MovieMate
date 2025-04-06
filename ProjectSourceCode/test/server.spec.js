

// ********************** Initialize server **********************************
const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************
const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************
describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
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
      .request(server)
      .post('/register')
      .send({username: 'John', password: 'password123', email: "John@email.com"})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });
  it('Negative : /register. Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 3, password: 'password123', email: "3@email.com"})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });
});

// Redirect returns a 200 status code no matter what we do
describe('Testing Redirect', () => {
  // Sample test case given to test /test endpoint.
  it('\test route should redirect to /login with 302 HTTP status code', done => {
    chai
      .request(server)
      .get('/test')
      .end((err, res) => {
        res.should.have.status(302); // Expecting a redirect status code
        res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); // Expecting a redirect to /login with the mentioned Regex
        done();
      });
  });
});

describe('Testing Render', () => {
  // Sample test case given to test /test endpoint.
  it('test "/login" route should render with an html response', done => {
    chai
      .request(server)
      .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
      .end((err, res) => {
        res.should.have.status(200); // Expecting a success status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });
});

// ********************** PART C **************************************

describe('/load-more API Integration', () => {
  it('Positive: should return paginated posts for page 1', done => {
    chai
      .request(server)
      .get('/load-more?page=1')
      .end((err, res) => {
        if (err) return done(err);
        
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('posts').that.is.an('array').with.lengthOf(5);
        expect(res.body.posts[0]).to.have.property('title'); 
        expect(res.body.posts[0]).to.have.property('user');
        done();
      });
  });

  it('Positive: should return the next batch of posts for page 2', done => {
    chai
      .request(server)
      .get('/load-more?page=2')
      .end((err, res) => {
        if (err) return done(err);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('posts').that.is.an('array').with.lengthOf(5);
        done();
      });
  });

  // Negative test case for out-of-range pages
  it('Negative: should return an empty array when the page exceeds the total number of posts', done => {
    chai
      .request(server)
      .get('/load-more?page=100') // Page 100 exceeds the bounds of the amount of posts
      .end((err, res) => {
        if (err) return done(err);
        expect(res).to.have.status(200);

        // Expecting an empty array of posts
        expect(res.body).to.have.property('posts').that.is.an('array').that.is.empty; 
        done();
      });
  });

  // Negative test case for an invalid page number
  it('Negative: should return an error for an invalid page number', done => {
    chai
      .request(server)
      .get('/load-more?page=-1') // Invalid page number
      .end((err, res) => {
        if (err) return done(err);
        expect(res).to.have.status(400); // Expect a 400 error
        expect(res.body).to.have.property('message').that.equals('Invalid page number');
        done();
      });
  });
});

