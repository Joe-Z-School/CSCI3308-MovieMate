DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS comments;
--Use DBML to define your database structure
--Docs: https://dbml.dbdiagram.io/docs

CREATE Table friends (
  following_user_id INT NOT NULL,
  followed_user_id INT NOT NULL,
  friends_since INT
);

CREATE Table users (
  id SERIAL PRIMARY KEY,
  username varchar(50) UNIQUE,
  password varchar(255) NOT NULL,
  email varchar(200),
  profile_icon varchar(100),
  bio varchar(150),
  created_at timestamp
);

CREATE Table movies (
  id SERIAL PRIMARY KEY,
  name varchar(100),
  rating decimal,
  genre varchar(50)
);

CREATE Table comments (
  id SERIAL PRIMARY KEY,
  username varchar(50),
  comment varchar(200),
  rating decimal
);

CREATE Table movies_to_comments (
  movie_id integer NOT NULL,
  comment_id integer NOT NULL
);

CREATE Table movies_to_users (
  user_id integer NOT NULL,
  movie_id integer NOT NULL,
  status varchar(50)
);

CREATE Table posts (
  id SERIAL PRIMARY KEY,
  title varchar (100),
  body text, 
  user_id integer NOT NULL,
  status varchar (50),
  liked varchar (50),
  created_at timestamp
);

