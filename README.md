# 🎥 YouTube Clone - MERN Stack Capstone Project

This is a full-stack YouTube Clone built using the **MERN stack (MongoDB, Express.js, React.js, Node.js)** as a capstone project. It simulates the core functionalities of YouTube, including video browsing, user authentication, and basic user interaction with videos.

---

## 📌 Project Objective

Create a real-world, full-stack application that demonstrates the use of the MERN stack. Users should be able to:
- View a list of videos with thumbnails
- Register and log in securely using JWT
- Browse videos with filters
- Interact with a UI similar to YouTube

---

## 🧩 Features

### 🚀 Front-End (React)
- **Home Page**
  - YouTube-style header
  - Toggleable static sidebar via hamburger menu
  - Filter buttons at the top (e.g., All, Trending, React, etc.)
  - Responsive grid of video thumbnails
  - Each video card displays:
    - Title
    - Thumbnail
    - Channel Name
    - Views

- **Authentication**
  - User Registration
  - User Login
  - JWT-based authentication
  - Protected routes for authenticated users

---

## 🗂 Sample Video Data

```json
[
  {
    "videoId": "video01",
    "title": "Learn React in 30 Minutes",
    "thumbnail URL": "https://example.com/thumbnails/react30min.png",
    "description": "A quick tutorial to get started with React.",
    "channelId": "channel01",
    "uploader": "user01",
    "views": 15200,
    "likes": 1023,
    "dislikes": 45,
    "uploadDate": "2024-09-20",
    "comments": [
      {
        "commentId": "comment01",
        "userId": "user02",
        "text": "Great video! Very helpful.",
        "timestamp": "2024-09-21T08:30:00Z"
      }
    ]
  }
]
```

###🛠️ Tech Stack

Frontend:
-React.js
-React Router
-Axios
-CSS / TailwindCSS / Bootstrap (your choice)

Backend:
-Node.js
-Express.js
-MongoDB (Mongoose)
-JWT (for authentication)
-bcrypt.js (for password hashing)
