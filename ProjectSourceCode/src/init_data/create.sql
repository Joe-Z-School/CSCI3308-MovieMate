DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS movies_to_comments;
DROP TABLE IF EXISTS movies_to_users;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS user_images;


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
  latest_message TEXT DEFAULT 'No messages yet',
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unread_count INT DEFAULT 0,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cover VARCHAR(255),
  where_to_watch VARCHAR(100),
  review DECIMAL,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE post_likes (
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
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
    content TEXT,
    image_url TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE messages_notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL,      -- who receives the notification
  sender_id INTEGER NOT NULL,         -- who sent the message (joins to users table)
  message TEXT NOT NULL,              -- notification content like "New message from..."
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL, -- who receives the notification
  sender_id INTEGER,             -- who caused it (optional)
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  poster_picture VARCHAR(40),
  where_to_watch VARCHAR(255),
  description TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  imdb_id VARCHAR(20) UNIQUE NOT NULL,
  image_data BYTEA NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_images (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL,
  sender_id INTEGER,
  recipient_id INTEGER,
  image_data BYTEA NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
