package com.bookstore.bookstore.service;

import com.bookstore.bookstore.model.Book;
import com.bookstore.bookstore.model.CartItem;
import com.bookstore.bookstore.repository.BookRepository;
import com.bookstore.bookstore.repository.CartItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;

    public CartService(CartItemRepository cartItemRepository, BookRepository bookRepository) {
        this.cartItemRepository = cartItemRepository;
        this.bookRepository = bookRepository;
    }

    public List<CartItem> getCartItems() {
        return cartItemRepository.findAll();
    }

    @Transactional
    public CartItem addToCart(Long bookId, int quantity) {
        if (bookId == null || quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book ID and a positive quantity are required");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        // Keep one cart row per book and add newly requested copies to it.
        CartItem item = cartItemRepository.findByBook_Id(bookId).orElseGet(() -> {
            CartItem newItem = new CartItem();
            newItem.setBook(book);
            newItem.setQuantity(0);
            return newItem;
        });
        item.setQuantity(item.getQuantity() + quantity);
        return cartItemRepository.save(item);
    }

    public void removeFromCart(Long itemId) {
        cartItemRepository.deleteById(itemId);
    }
}
