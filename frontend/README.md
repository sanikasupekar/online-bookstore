# Bookstore frontend

This React app uses Vite and calls the Spring Boot API at `http://localhost:8080`.

## Start the apps

1. Start MySQL and the backend from the `bookstore` backend folder:
   `.\mvnw.cmd spring-boot:run`
2. In this `frontend` folder, install dependencies and start Vite:
   `npm install`
   `npm run dev`
3. Open `http://localhost:5173`.

The backend allows this local Vite origin through its CORS configuration. The
cart is a shared cart stored in the backend database; it is not tied to a user.

## Authentication

Use the Login and Register links to authenticate with the backend. The frontend
stores the JWT in local storage, sends it with API requests, and shows cart
features to signed-in users and book management to admins. Expired or rejected
sessions are cleared automatically.
