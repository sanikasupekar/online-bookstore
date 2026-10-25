# Online Bookstore

A full stack web application to browse, search and manage books, with a shopping cart.

## Tech Stack
- **Backend:** Java 17, Spring Boot, Spring Data JPA (Hibernate), REST API
- **Database:** MySQL
- **Frontend:** React (Vite)
- **Tools:** Maven, Postman, Git

## Features
- View all books and book details
- Search books by title or author
- Add, edit and delete books
- Add books to cart and remove them

## Architecture
Layered architecture on the backend:

Controller -> Service -> Repository -> MySQL

The React frontend calls the REST API (CORS enabled for http://localhost:5173).

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /books | Get all books |
| GET | /books/{id} | Get one book |
| POST | /books | Add a book |
| PUT | /books/{id} | Update a book |
| DELETE | /books/{id} | Delete a book |
| GET | /books/search/title?title= | Search by title |
| GET | /books/search/author?author= | Search by author |
| GET | /cart | View cart |
| POST | /cart/add/{bookId} | Add to cart |
| DELETE | /cart/{id} | Remove from cart |

## How to Run

### Prerequisites
Java 17, Maven, MySQL, Node.js

### Database
Create a database named `bookstore`:

    CREATE DATABASE bookstore;

### Backend
1. Create `bookstore/src/main/resources/application-local.properties` with:

       spring.datasource.password=YOUR_MYSQL_PASSWORD

2. Run `BookstoreApplication.java` (server starts on port 8080)

### Frontend

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173

## Future Improvements
- Login/Register with Spring Security and JWT
- Role-based access (Admin / User)
- Per-user cart and order placement
