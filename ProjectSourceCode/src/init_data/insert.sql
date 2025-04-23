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
INSERT INTO posts (title, body, user_id, status, created_at, cover, where_to_watch, review, movieTitle, movieDescription)
VALUES 
('Inception Thoughts', 'Christopher Nolan never disappoints!', 7, 'public', NOW(), '/resources/img/inception.jpeg', 'Netflix', 4.8, 'Inception', 'A skilled thief is given a chance at redemption if he can successfully perform an inception.'),
('Exploring the Cosmos', 'Just rewatched this masterpiece.', 2, 'public', NOW(), '/resources/img/interstellar.jpg', 'Hulu', 4.7, 'Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.'),
('Marvel Marathon', 'Kicked off my Marvel journey again.', 3, 'public', NOW(), '/resources/img/avengers.jpeg', 'Disney+', 4.5, 'The Avengers', 'Earth''s mightiest heroes must come together to stop Loki and his alien army.'),
('Rom-Com Night', 'Such a cute movie!', 8, 'public', NOW(), '/resources/img/crazyrichasians.jpeg', 'HBO Max', 4.2, 'Crazy Rich Asians', 'A New Yorker travels to Singapore to meet her boyfriend''s ultra-wealthy family.'),
('Throwback Classic', 'Old but gold.', 10, 'public', NOW(), '/resources/img/jurassicpark.jpg', 'Peacock', 4.9, 'Jurassic Park', 'During a preview tour, a theme park suffers a major power breakdown that allows its cloned dinosaur exhibits to run amok.'),
('Animated Feels', 'Pixar always hits right in the feels.', 3, 'public', NOW(), '/resources/img/up.jpeg', 'Disney+', 4.8, 'Up', 'An elderly man and a young boy embark on an unexpected adventure to South America.'),
('Horror Vibes', 'Couldn''t sleep after this one.', 7, 'public', NOW(), '/resources/img/getout.jpeg', 'Peacock', 4.6, 'Get Out', 'A young African-American visits his white girlfriend''s parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.'),
('Sci-Fi Wonder', 'Visually stunning and mind-blowing.', 8, 'public', NOW(), '/resources/img/arrival.jpeg', 'Paramount+', 4.4, 'Arrival', 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.'),
('Feel-Good Comedy', 'Laughed so much!', 9, 'public', NOW(), '/resources/img/theoffice.jpeg', 'Netflix', 4.3, 'The Office', 'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.'),
('Action-Packed', 'High octane action all the way.', 10, 'public', NOW(), '/resources/img/madmax.jpeg', 'HBO Max', 4.7, 'Mad Max: Fury Road', 'In a post-apocalyptic wasteland, Max teams up with a mysterious woman to flee from a tyrannical ruler.'),
('Romantic Drama', 'So emotional and beautiful.', 9, 'public', NOW(), '/resources/img/la-la-land.jpeg', 'Hulu', 4.5, 'La La Land', 'A jazz musician and an aspiring actress fall in love while pursuing their dreams.');


INSERT INTO post_likes (user_id, post_id) VALUES
(1, 1), -- Lizzie likes Nick's Inception post
(2, 2), -- Max likes his own Interstellar post
(3, 1), -- Sara likes Nick's Inception post
(4, 3), -- Matt likes Sara's Marvel post
(5, 5), -- Jessie likes Taylor's Jurassic Park post
(6, 7), -- Kay likes Lizzie's Get Out post
(7, 6), -- Nick likes Sara's Up post
(8, 4), -- Amy likes her own Crazy Rich Asians post
(9, 8), -- Omar likes Amy's Arrival post
(10, 10), -- Taylor likes his own Mad Max post
(3, 7), -- Sara likes Lizzie's Get Out post
(1, 6), -- Lizzie likes Sara's Up post
(5, 2), -- Jessie likes Max's Interstellar post
(2, 5); -- Max likes Taylor's Jurassic Park post

INSERT INTO post_comments (user_id, post_id, comment) VALUES
(1, 2, 'Interstellar blew my mind too!'), -- Lizzie comments on Max's Interstellar post
(3, 1, 'Inception is a masterpiece!'), -- Sara comments on Nick's Inception post
(4, 3, 'Marvel marathons are the best!'), -- Matt on Sara's Marvel post
(5, 6, 'Pixar movies always get me emotional.'), -- Jessie on Sara's Up post
(2, 5, 'Jurassic Park never gets old.'), -- Max on Taylor's Jurassic Park post
(7, 4, 'Crazy Rich Asians was so fun!'), -- Nick on Amy's post
(8, 8, 'Arrival makes you think.'), -- Amy on her own post
(9, 10, 'Mad Max is such a ride!'), -- Omar on Taylor's Mad Max post
(10, 7, 'Get Out was so intense!'), -- Taylor on Lizzie's Get Out post
(6, 9, 'The Office never fails!'), -- Kay on Omar's The Office post
(3, 7, 'Couldn''t sleep after watching Get Out either!'), -- Sara on Lizzie's post
(1, 8, 'Arrival really makes you appreciate language.'), -- Lizzie on Amy's Arrival post
(5, 2, 'Love Nolan''s work!'), -- Jessie on Max's Interstellar post
(4, 1, 'Inception is a classic!'); -- Matt on Nick's Inception post



INSERT INTO friends (following_user_id, followed_user_id) VALUES
(1, 2), -- Lizzie follows Max
(1, 3), -- Lizzie follows Sara
(2, 1), -- Max follows Lizzie
(2, 5), -- Max follows Jessie
(3, 4), -- Sara follows Matt
(3, 1), -- Sara follows Lizzie
(4, 2), -- Matt follows Max
(4, 6), -- Matt follows Kay
(5, 1), -- Jessie follows Lizzie
(5, 3), -- Jessie follows Sara
(6, 5), -- Kay follows Jessie
(6, 9), -- Kay follows Omar
(7, 1), -- Nick follows Lizzie
(8, 9), -- Amy follows Omar
(9, 10), -- Omar follows Taylor
(10, 1), -- Taylor follows Lizzie
(10, 4); -- Taylor follows Matt;