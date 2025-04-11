DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS movies_to_comments;
DROP TABLE IF EXISTS movies_to_users;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS messages;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(200),
  profile_icon VARCHAR(100),
  bio VARCHAR(150),
  created_at TIMESTAMP,
  followers_count INTEGER ,
  following_count INTEGER,
  first_name VARCHAR(50),
  last_name VARCHAR(50)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  imdb_id VARCHAR(20) UNIQUE,
  year VARCHAR(10),
  rating DECIMAL,
  genre VARCHAR(100),
  poster VARCHAR(255)
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  comment VARCHAR(200),
  rating DECIMAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movies_to_comments (
  movie_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  PRIMARY KEY (movie_id, comment_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE movies_to_users (
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL, 
  PRIMARY KEY (user_id, movie_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE friends (
  following_user_id INTEGER NOT NULL,
  followed_user_id INTEGER NOT NULL,
  friends_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (following_user_id, followed_user_id),
  FOREIGN KEY (following_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100),
  body TEXT, 
  user_id INTEGER NOT NULL,
  status VARCHAR(50),
  liked VARCHAR(50),
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE follow_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- could be 'pending', 'approved', 'rejected'
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id),
    recipient_id INT REFERENCES users(id),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  poster_picture VARCHAR(255) NOT NULL,
  where_to_watch VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);