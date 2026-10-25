# Bookstore backend

Spring Boot REST API using MySQL, Spring Data JPA, BCrypt password hashing, and
stateless JWT authentication.

## Local configuration

`src/main/resources/application-local.properties` is ignored by Git. Create it
locally and provide your own values; never commit this file or real secrets:

```properties
spring.datasource.password=<your-mysql-password>
jwt.secret=<at-least-32-random-bytes-or-base64:encoded-32-random-bytes>
jwt.expiration-ms=3600000
admin.username=<your-admin-username>
admin.password=<your-admin-password>
```

The JWT secret must be at least 32 bytes for the HS256 signing key (or provide
`base64:` followed by a Base64-encoded 32-byte secret). Use a different strong
value for every environment. Set `jwt.expiration-ms` to `3600000` for one-hour
tokens.

## Authentication and access

- `POST /auth/register` accepts `{"username":"...","password":"..."}` and
  creates a `USER` with a BCrypt-hashed password.
- `POST /auth/login` accepts the same shape and returns a bearer token.
- `GET /books/**` is public; book mutations require an `ADMIN` token.
- `/cart/**` requires a valid bearer token.
- On startup, the configured administrator is created if the database has no
  `ADMIN` account. If the configured username already belongs to a user, that
  account is promoted and its password is replaced with the configured hashed
  password.

Pass tokens in the `Authorization: Bearer <token>` header.
