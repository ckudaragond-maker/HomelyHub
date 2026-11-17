# 🏡 HomelyHub – Property Booking Web Application

HomelyHub is a full-stack property booking web application developed using the MERN stack. It allows users to explore properties, view property information, make bookings, and manage their existing bookings through a user-friendly interface.

## ✨ Implemented Features

- 🏠 Browse available properties.
- 🏡 View property details.
- 📅 Book properties by selecting check-in and check-out dates.
- 👥 Select the number of guests.
- 📋 View existing bookings in My Bookings.
- ❌ Cancel existing bookings.
- 💾 MongoDB integration for storing property and booking data.
- ⚡ Frontend and backend integration.
- 🔄 Demo mode when database connectivity is unavailable.

## 🛠️ Technologies Used

- React.js – Frontend
- Node.js – Backend runtime
- Express.js – Backend framework
- MongoDB – Database
- Mongoose – MongoDB object modelling
- JavaScript – Programming language
- CSS – Styling
- Vite – Frontend development tool

## 📂 Project Structure

```text
HomelyHub/
├── backend/
│   ├── models/
│   │   ├── Booking.js
│   │   └── Property.js
│   ├── package.json
│   ├── package-lock.json
│   ├── seedProperties.js
│   └── server.js
│
└── frontend/
    ├── assets/
    ├── public/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── Booking.js
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    ├── package-lock.json
    └── vite.config.js
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/ckudaragond-maker/HomelyHub.git
```

### 2. Backend setup

```bash
cd HomelyHub/backend
npm install
```

Create a `.env` file in the backend folder and configure:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Start the backend:

```bash
npm start
```

### 3. Frontend setup

Open another terminal:

```bash
cd HomelyHub/frontend
npm install
npm run dev
```

Open the local URL provided by Vite.

## 👩‍💻 Developer

**Chaitra Kudaragond**

GitHub: https://github.com/ckudaragond-maker

## 📌 Project Status

HomelyHub is a personal full-stack web development project built to demonstrate property browsing, booking management, and frontend-backend integration using the MERN stack.
