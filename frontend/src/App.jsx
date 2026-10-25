import React, { useEffect, useState } from "react";
import { apiRequest, AUTH_EXPIRY_KEY, AUTH_TOKEN_KEY } from './api.js';

const emptyBook = { title: '', author: '', price: '' };

function decodeTokenPayload(token) {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) {
    throw new Error('The authentication token is invalid.');
  }

  const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')));
}

function readAuthSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  try {
    const payload = decodeTokenPayload(token);
    const role = String(payload.role || '').replace(/^ROLE_/, '').toUpperCase();
    const expiresAt = Number(payload.exp) * 1000
      || Number(localStorage.getItem(AUTH_EXPIRY_KEY));
    if (!['ADMIN', 'USER'].includes(role) || !expiresAt || expiresAt <= Date.now()) {
      throw new Error('The saved login session is invalid or has expired.');
    }

    return {
      token,
      username: payload.username || payload.sub || 'User',
      role,
      expiresAt,
    };
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    return null;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export default function App() {
  // Keep navigation, API data, and the admin form in one small app state.
  const [page, setPage] = useState('books');
  const [auth, setAuth] = useState(readAuthSession);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [bookForm, setBookForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  // Load the catalog and shared cart from the backend.
  async function loadBooks(search = '') {
    const path = search.trim()
      ? `/books/search?q=${encodeURIComponent(search.trim())}`
      : '/books';
    setBooks(await apiRequest(path));
  }

  async function loadCart() {
    setCart(await apiRequest('/cart'));
  }

  const isAdmin = auth?.role === 'ADMIN';

  useEffect(() => {
    loadBooks().catch((requestError) => {
      setError(requestError.message);
    });
  }, []);

  useEffect(() => {
    if (!auth) {
      setCart([]);
      return;
    }
    loadCart().catch((requestError) => setError(requestError.message));
  }, [auth?.token]);

  useEffect(() => {
    function handleAuthExpired() {
      setAuth(null);
      setCart([]);
      setPage('login');
      setError('Your session has expired. Please log in again.');
    }

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_EXPIRY_KEY);
      setAuth(null);
      setCart([]);
      setPage('login');
      setError('Your session has expired. Please log in again.');
    }, Math.max(0, auth.expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [auth]);

  function changePage(nextPage) {
    if (nextPage === 'admin' && !isAdmin) {
      return;
    }
    if (nextPage === 'cart' && !auth) {
      setPage('login');
      return;
    }
    setError('');
    setAuthNotice('');
    setPage(nextPage);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    setAuthNotice('');

    try {
      const response = await apiRequest(`/auth/${page}`, {
        method: 'POST',
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword }),
      });

      if (page === 'register') {
        setAuthPassword('');
        setAuthNotice('Account created. Please log in.');
        setPage('login');
        return;
      }

      const token = response.token;
      const payload = decodeTokenPayload(token);
      const role = String(payload.role || '').replace(/^ROLE_/, '').toUpperCase();
      if (!['ADMIN', 'USER'].includes(role)) {
        throw new Error('The login response did not include a valid user role.');
      }

      const expiresAt = Number(payload.exp) * 1000
        || Date.now() + (Number(response.expiresIn) || 3600) * 1000;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_EXPIRY_KEY, String(expiresAt));
      setAuth({
        token,
        username: payload.username || payload.sub || authUsername.trim(),
        role,
        expiresAt,
      });
      setAuthPassword('');
      setPage('books');
    } catch (requestError) {
      setError(requestError.status === 401
        ? 'Incorrect username or password. Please try again.'
        : requestError.message);
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    setAuth(null);
    setCart([]);
    setPage('books');
    setError('');
  }

  async function searchBooks(event) {
    event.preventDefault();
    setError('');
    try {
      await loadBooks(query);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function addToCart(bookId) {
    setError('');
    try {
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ bookId, quantity: 1 }),
      });
      await loadCart();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startEditing(book) {
    setBookForm({
      title: book.title,
      author: book.author,
      price: book.price,
    });
    setEditingId(book.id);
    setPage('admin');
    setError('');
  }

  function resetBookForm() {
    setBookForm(emptyBook);
    setEditingId(null);
  }

  async function saveBook(event) {
    event.preventDefault();
    setError('');
    const book = {
      title: bookForm.title.trim(),
      author: bookForm.author.trim(),
      price: Number(bookForm.price),
    };

    try {
      await apiRequest(editingId === null ? '/books' : `/books/${editingId}`, {
        method: editingId === null ? 'POST' : 'PUT',
        body: JSON.stringify(book),
      });
      resetBookForm();
      await loadBooks(query);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteBook(bookId) {
    if (!window.confirm('Delete this book?')) {
      return;
    }

    setError('');
    try {
      await apiRequest(`/books/${bookId}`, { method: 'DELETE' });
      await Promise.all([loadBooks(query), loadCart()]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeCartItem(itemId) {
    setError('');
    try {
      await apiRequest(`/cart/${itemId}`, { method: 'DELETE' });
      await loadCart();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.book.price * item.quantity,
    0,
  );

  // Switch between the catalog, admin form/list, and cart views.
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" onClick={() => changePage('books')}>
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>Paper &amp; Page</span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={page === 'books' ? 'nav-link active' : 'nav-link'}
            onClick={() => changePage('books')}
          >
            Browse books
          </button>
          {isAdmin && (
            <button
              className={page === 'admin' ? 'nav-link active' : 'nav-link'}
              onClick={() => changePage('admin')}
            >
              Manage books
            </button>
          )}
          {auth ? (
            <button
              className={page === 'cart' ? 'nav-link active' : 'nav-link'}
              onClick={() => changePage('cart')}
            >
              Cart <span className="cart-count">{cartCount}</span>
            </button>
          ) : (
            <>
              <button className="nav-link" onClick={() => changePage('login')}>Login</button>
              <button className="nav-link" onClick={() => changePage('register')}>Register</button>
            </>
          )}
          {auth && (
            <div className="account-menu">
              <span className="account-label">{auth.username} ({auth.role})</span>
              <button className="nav-link" onClick={logout}>Logout</button>
            </div>
          )}
        </nav>
      </header>

      <main>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {(page === 'login' || page === 'register') && (
          <section className="auth-layout">
            <div className="page-intro">
              <p className="eyebrow">{page === 'login' ? 'Welcome back' : 'Join the bookstore'}</p>
              <h1>{page === 'login' ? 'Log in to your account' : 'Create an account'}</h1>
            </div>
            {authNotice && <p className="success-banner" role="status">{authNotice}</p>}
            <form className="book-form panel" onSubmit={submitAuth}>
              <label>
                Username
                <input
                  autoComplete="username"
                  required
                  value={authUsername}
                  onChange={(event) => setAuthUsername(event.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  autoComplete={page === 'login' ? 'current-password' : 'new-password'}
                  required
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
              </label>
              <button className="button button-dark" type="submit">
                {page === 'login' ? 'Log in' : 'Register'}
              </button>
              <button
                className="text-button auth-switch"
                type="button"
                onClick={() => {
                  setError('');
                  setAuthNotice('');
                  setPage(page === 'login' ? 'register' : 'login');
                }}
              >
                {page === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
              </button>
            </form>
          </section>
        )}

        {page === 'books' && (
          <section>
            <div className="hero">
              <p className="eyebrow">A little something to read</p>
              <h1>Find your next<br />favorite story.</h1>
              <p className="hero-copy">
                Explore the shelves and bring a good book home.
              </p>
            </div>
            <div className="section-heading">
              <div>
                <p className="eyebrow">The collection</p>
                <h2>Books for every kind of day</h2>
              </div>
              <form className="search-form" onSubmit={searchBooks}>
                <label className="sr-only" htmlFor="book-search">
                  Search books by title or author
                </label>
                <input
                  id="book-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Title or author"
                />
                <button className="button button-dark" type="submit">Search</button>
              </form>
            </div>
            {books.length === 0 ? (
              <p className="empty-state">No books found. Try another search.</p>
            ) : (
              <div className="book-grid">
                {books.map((book, index) => (
                  <article className="book-card" key={book.id}>
                    <div className={`book-cover cover-${index % 4}`}>
                      <span className="cover-decoration" aria-hidden="true">✳</span>
                      <span className="cover-title">{book.title}</span>
                      <span className="cover-author">{book.author}</span>
                    </div>
                    <div className="book-info">
                      <div>
                        <h3>{book.title}</h3>
                        <p className="muted">{book.author}</p>
                      </div>
                      <strong>{formatPrice(book.price)}</strong>
                    </div>
                    {auth && (
                      <button
                        className="button button-outline full-width"
                        onClick={() => addToCart(book.id)}
                      >
                        Add to cart
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {page === 'admin' && isAdmin && (
          <section className="admin-layout">
            <div className="page-intro">
              <p className="eyebrow">Admin</p>
              <h1>Manage the collection</h1>
              <p className="muted">Add a new title or update books already on the shelf.</p>
            </div>
            <form className="book-form panel" onSubmit={saveBook}>
              <h2>{editingId === null ? 'Add a book' : 'Edit book'}</h2>
              <label>
                Title
                <input
                  required
                  value={bookForm.title}
                  onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })}
                />
              </label>
              <label>
                Author
                <input
                  required
                  value={bookForm.author}
                  onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })}
                />
              </label>
              <label>
                Price
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={bookForm.price}
                  onChange={(event) => setBookForm({ ...bookForm, price: event.target.value })}
                />
              </label>
              <div className="form-actions">
                <button className="button button-dark" type="submit">
                  {editingId === null ? 'Add book' : 'Save changes'}
                </button>
                {editingId !== null && (
                  <button className="button button-quiet" type="button" onClick={resetBookForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <div className="panel admin-list">
              <div className="section-heading compact">
                <h2>Current books</h2>
                <span className="muted">{books.length} titles</span>
              </div>
              {books.length === 0 ? (
                <p className="empty-state">No books to manage yet.</p>
              ) : (
                books.map((book) => (
                  <div className="admin-row" key={book.id}>
                    <div>
                      <strong>{book.title}</strong>
                      <p className="muted">{book.author} · {formatPrice(book.price)}</p>
                    </div>
                    <div className="row-actions">
                      <button className="text-button" onClick={() => startEditing(book)}>Edit</button>
                      <button className="text-button danger-text" onClick={() => deleteBook(book.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {page === 'cart' && auth && (
          <section>
            <div className="page-intro">
              <p className="eyebrow">Your selection</p>
              <h1>Shopping cart</h1>
            </div>
            {cart.length === 0 ? (
              <div className="empty-state panel">
                <h2>Your cart is waiting for a good book.</h2>
                <button className="button button-dark" onClick={() => changePage('books')}>
                  Browse books
                </button>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="panel cart-items">
                  {cart.map((item) => (
                    <article className="cart-row" key={item.id}>
                      <div className="mini-cover" aria-hidden="true">✳</div>
                      <div className="cart-book">
                        <h2>{item.book.title}</h2>
                        <p className="muted">{item.book.author}</p>
                        <p className="muted">Quantity: {item.quantity}</p>
                      </div>
                      <strong>{formatPrice(item.book.price * item.quantity)}</strong>
                      <button
                        className="text-button danger-text"
                        onClick={() => removeCartItem(item.id)}
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
                <aside className="panel cart-summary">
                  <h2>Order summary</h2>
                  <div className="summary-row">
                    <span>Items</span>
                    <span>{cartCount}</span>
                  </div>
                  <div className="summary-row total-row">
                    <strong>Total</strong>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
                  <p className="muted">Shipping and taxes calculated at checkout.</p>
                </aside>
              </div>
            )}
          </section>
        )}
      </main>

      <footer>Good books make good days.</footer>
    </div>
  );
}
