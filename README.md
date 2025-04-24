<p align="center">
  <img src="https://github.com/user-attachments/assets/775117b4-4703-4ce8-bf61-f58cf2a50539" alt="MovieMate" width="350"/>
</p>


# 🎥 MovieMate

**MovieMate** is a full-featured social media platform for movie lovers. Create a profile, connect with friends, review films, and explore trending movies — all in one place.

---

## 🌐 Live App & Demo Video

<p align="center">
  <a href="https://csci3308-moviemate.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Live%20App-Visit-blueviolet?style=for-the-badge" alt="Live App Badge"/>
  </a>
  <a href="https://vimeo.com/1078150699?share=copy" target="_blank">
    <img src="https://img.shields.io/badge/%20Demo%20Video-Vimeo-1ab7ea?style=for-the-badge&logo=vimeo&logoColor=white" alt="Demo Video on Vimeo Badge"/>
  </a>
</p>

---

## 📚 Table of Contents

- [✨ Features](#-features)
- [🛠 Technologies Used](#-technologies-used)
- [🗺️ Architecture](#-architecture)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#-configuration)
- [🔑 API Keys](#-api-keys)
- [🗃 Database Setup](#-database-setup)
- [🚀 Running the Application](#-running-the-application)
- [📁 Project Structure](#-project-structure)
- [📡 API Overview](#-api-overview)
- [👨‍💼 Contributors](#-contributors)

---

## ✨ Features

### 👤 User Management
- **Register & Authenticate**: Sign up with a username, password, and profile info.
- **Edit Profiles**: Update bios, profile images, and account details.
- **Follow System**: Send/receive follow requests and build your movie circle.

### 🎥 Movie Discovery & Interaction
- **Explore Movies**: Browse popular, trending, and new movie releases.
- **Smart Search**: Filter by title, genre, cast, or director.
- **Detailed View**: Dive into cast, plot, ratings, and trailers.
- **Watchlist**: Keep track of movies you plan to watch.
- **Reviews & Ratings**: Share personal takes and see what others thought.

### 📱 Social Features
- **News Feed**: See what your friends are watching and reviewing.
- **Comments & Likes**: Interact on movie posts.
- **Notifications**: Stay updated on social activity.
- **Real-time Chat**: Talk movies with friends instantly via built-in messaging.

---


## 🛠 Technologies Used

### ⚙️ Stack Summary

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
  <img src="https://img.shields.io/badge/Bootstrap-563d7c?style=for-the-badge&logo=bootstrap&logoColor=white"/>
  <img src="https://img.shields.io/badge/Handlebars.js-f0772b?style=for-the-badge&logo=handlebarsdotjs&logoColor=white"/>
</p>

---

### Frontend
- Handlebars (HBS)
- JavaScript
- Bootstrap 5
- CSS
- Socket.IO (client)

### Backend
- Node.js
- Express.js
- PostgreSQL (via `pg-promise`)
- Socket.IO (server)
- bcryptjs (secure password hashing)
- express-session (authentication session handling)

### External APIs
- **OMDb API** – for movie metadata
- **YouTube Data API** – for trailers

---

## 🗺️ Architecture

![image](https://github.com/user-attachments/assets/c8b2ab2f-a093-49b2-8a9f-5e6758d18fbc)

---

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- Docker + Docker Compose *(optional but recommended)*

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/moviemate.git
   cd moviemate
   ```

2. **Install Node.js Dependencies**
   ```bash
   npm install
   ```

---

## ⚙️ Configuration

Create a `.env` file at the root with the following content:

```env
# PostgreSQL Config
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=moviemate_db
HOST=db

# Session Config
SESSION_SECRET=your_session_secret

# External API Keys
OMDB_API_KEY=your_omdb_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## 🔑 API Keys

### OMDb API
1. Visit [OMDb API Key Request](https://www.omdbapi.com/apikey.aspx)
2. Add your key to `.env` under `OMDB_API_KEY`

### YouTube Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **YouTube Data API v3**
3. Generate an API key and add to `.env` under `YOUTUBE_API_KEY`

---

## 🗃 Database Setup

The schema and initial data are located in:
- `src/init_data/create.sql`
- `src/init_data/insert.sql`

If using Docker Compose, these scripts will be executed automatically.

---

## 🚀 Running the Application

### 🔧 Option 1: Docker Compose (Recommended)

```bash
docker-compose up
```

Then visit: [http://localhost:3000](http://localhost:3000)

### 💻 Option 2: Manual Setup

1. Start PostgreSQL and ensure credentials match `.env`
2. Start the app:
   ```bash
   npm start
   ```
3. App will run at [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
moviemate/
├── docker-compose.yaml         # Docker config
├── package.json                # App metadata and scripts
├── src/
│   ├── api/                    # External API integrations (OMDb, YouTube)
│   ├── config/                 # Configuration files
│   ├── controllers/            # Route handlers and logic
│   ├── init_data/              # SQL schema and seed data
│   ├── resources/              # Static assets (JS, CSS, images)
│   ├── views/                  # Handlebars templates
│   │   ├── layouts/            # HTML layout templates
│   │   ├── pages/              # Page-specific HBS templates
│   │   └── partials/           # Reusable UI components
│   └── index.js                # Entry point for server
```

---

## 📡 API Overview

MovieMate includes a robust set of RESTful API routes that power features like user authentication, movie discovery, reviews, and messaging.

**Key API groups:**
- `/api/movies/` – Search, details, watchlists, reviews, and trailers
- `/api/users/` – Register, login, logout, profile management
- `/api/social/` – Follow users, post reviews, and real-time messaging
---

## 👨‍💼 Contributors

| NAME | CU-EMAIL | GITHUB USERNAME |
| ---- | -------- | --------------- |
| Neha Ramachandra | nera4157@colorado.edu | [nehabykadi](https://github.com/nehabykadi) |
| Conner Groth | conner.groth@colorado.edu | [connergroth](https://github.com/connergroth) |
| Joe Zakrzewski | joe.zakrzewski@colorado.edu | [joe-z-school](https://github.com/joe-z-school) |
| Lizzie Ruff | lizzie.ruff@colorado.edu | [liru4345](https://github.com/liru4345) |
| Maeve Pettey | maeve.pettey@colorado.edu | [maevePettey](https://github.com/maevePettey) |
| Ella Pasternak | ella.pasternak@colorado.edu | [elpaster](https://github.com/elpaster) |
