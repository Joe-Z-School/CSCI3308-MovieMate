INSERT INTO users (username, password, email, profile_icon, bio, followers_count, following_count, created_at, first_name, last_name) VALUES
('liz_ruff', 'password123', 'lizzie@example.com', 'profile_pic_option_1.png', 'Runner. Coder. Coffee fan.', 3, 2, CURRENT_TIMESTAMP, 'Lizzie', 'Ruff'),
('max_power', 'supersecure', 'max@example.com', 'profile_pic_option_2.png', 'Tech nerd & gym rat.', 1, 3, CURRENT_TIMESTAMP, 'Max', 'Power'),
('sara_sky', 'ilovecats', 'sara@example.com', 'profile_pic_option_3.png', 'Plant mom & movie buff.', 2, 1, CURRENT_TIMESTAMP, 'Sara', 'Sky'),
('code_matt', 'hashbrown1', 'matt@example.com', 'profile_pic_option_4.png', 'JavaScript evangelist.', 0, 2, CURRENT_TIMESTAMP, 'Matt', 'Smith'),
('jessie_writer', 'notebook42', 'jessie@example.com', 'profile_pic_option_5.png', 'Writer by day, dreamer by night.', 4, 1, CURRENT_TIMESTAMP, 'Jessie', 'Writer'),
('kay_the_creator', 'creative123', 'kay@example.com', 'profile_pic_option_6.png', 'Design. Develop. Repeat.', 2, 2, CURRENT_TIMESTAMP, 'Kay', 'Creator'),
('nick_flicks', 'movies4life', 'nick@example.com', 'profile_pic_option_1.png', 'Letterboxd addict 🎬', 1, 2, CURRENT_TIMESTAMP, 'Nick', 'Flicks'),
('amy_codes', 'amyrules', 'amy@example.com', 'profile_pic_option_2.png', 'Front-end dev & dog mom.', 0, 1, CURRENT_TIMESTAMP, 'Amy', 'Codes'),
('omar_ocean', 'waves123', 'omar@example.com', 'profile_pic_option_3.png', 'Surfer. Engineer. Explorer.', 2, 1, CURRENT_TIMESTAMP, 'Omar', 'Ocean'),
('taylor_dev', 'password456', 'taylor@example.com', 'profile_pic_option_4.png', 'Backend builder & API fan.', 3, 3, CURRENT_TIMESTAMP, 'Taylor', 'Dev');

-- Insert 15 sample posts using only user_id 1-10
INSERT INTO posts (title, body, user_id, status, created_at, cover, where_to_watch, review)
VALUES 
('Inception', 'A mind-bending thriller by Nolan.', 1, 'public', NOW(), '../resources/img/moviePic.jpeg', 'Netflix', 4),
('Interstellar', 'Explores the stars and time.', 2, 'public', NOW(), '../resources/img/famWatching.jpeg', 'Hulu', 3.5),
('TestTitle3', 'Test Description for TestTitle3.', 3, 'public', NOW(), '../resources/img/girlWatching.jpg', 'HBO', 3),
('TestTitle4', 'Test Description for TestTitle4.', 4, 'public', NOW(), '../resources/img/popcorn.jpeg', 'Netflix', 1.1),
('TestTitle5', 'Test Description for TestTitle5.', 5, 'public', NOW(), '../resources/img/cake.jpeg', 'HBO', 5),
('TestTitle6', 'Test Description for TestTitle6.', 6, 'public', NOW(), '../resources/img/moviePic.jpeg', 'Paramount', 4.1),
('TestTitle7', 'Test Description for TestTitle7.', 7, 'public', NOW(), '../resources/img/famWatching.jpeg', 'Disney', 2.5),
('TestTitle8', 'Test Description for TestTitle8.', 8, 'public', NOW(), '../resources/img/cake.jpeg', 'Netflix', 3),
('TestTitle9', 'Test Description for TestTitle9.', 9, 'public', NOW(), '../resources/img/popcorn.jpeg', 'Netflix', 1),
('TestTitle10', 'Test Description for TestTitle10.', 10, 'public', NOW(), '../resources/img/girlWatching.jpg', 'HBO', 1),
('TestTitle11', 'Test Description for TestTitle11.', 1, 'public', NOW(), '../resources/img/popcorn.jpeg', 'Hulu', 4),
('TestTitle12', 'Test Description for TestTitle12.', 2, 'public', NOW(), '../resources/img/cake.jpeg', 'Hulu', 2.1),
('TestTitle13', 'Test Description for TestTitle13.', 3, 'public', NOW(), '../resources/img/girlWatching.jpg', 'Disney', 4.8),
('TestTitle14', 'Test Description for TestTitle14.', 4, 'public', NOW(), '../resources/img/moviePic.jpeg', 'Disney', 2.7),
('TestTitle15', 'Test Description for TestTitle15.', 5, 'public', NOW(), '../resources/img/moviePic.jpeg', 'Paramount', 1.9);


-- 👥 General Notifications
INSERT INTO notifications (recipient_id, sender_id, message)
VALUES
  (4, 2, 'max_power accepted your follow request.'),
  (5, 3, 'sara_sky commented on your post.'),
  (6, 5, 'jessie_writer started following you.'),
  (3, NULL, '🎉 Welcome to MovieMate!');

-- 💬 Message Notifications
INSERT INTO messages_notifications (recipient_id, sender_id, message)
VALUES
  (1, 2, 'Hey! You around to chat?'),
  (2, 3, 'Let’s catch up later.'),
  (7, 5, 'Just saw your review, loved it!');