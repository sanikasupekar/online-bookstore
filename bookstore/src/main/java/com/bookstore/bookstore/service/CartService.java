package com.bookstore.bookstore.service;

import com.bookstore.bookstore.model.Book;
import com.bookstore.bookstore.model.CartItem;
import com.bookstore.bookstore.repository.BookRepository;
import com.bookstore.bookstore.repository.CartItemRepository;
import com.bookstore.bookstore.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public CartService(
            CartItemRepository cartItemRepository,
            BookRepository bookRepository,
            UserRepository userRepository) {
        this.cartItemRepository = cartItemRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    public List<CartItem> getCartItems(String username) {
        return cartItemRepository.findAllByUser_Username(username);
    }

    @Transactional
    public CartItem addToCart(String username, Long bookId, Integer quantity) {
        if (bookId == null || quantity == null || quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book ID and a positive quantity are required");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        // Keep one cart row per book and add newly requested copies to it.
        CartItem item = cartItemRepository.findByUser_UsernameAndBook_Id(username, bookId).orElseGet(() -> {
            CartItem newItem = new CartItem();
            newItem.setBook(book);
            newItem.setUser(userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
            newItem.setQuantity(0);
            return newItem;
        });
        item.setQuantity(item.getQuantity() + quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeFromCart(String username, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        if (item.getUser() == null || !item.getUser().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot remove another user's cart item");
        }
        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(String username) {
        cartItemRepository.deleteAllByUser_Username(username);
    }
}
