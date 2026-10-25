package com.bookstore.bookstore.service;

import com.bookstore.bookstore.model.Book;
import com.bookstore.bookstore.repository.BookRepository;
import com.bookstore.bookstore.repository.CartItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final CartItemRepository cartItemRepository;

    public BookService(BookRepository bookRepository, CartItemRepository cartItemRepository) {
        this.bookRepository = bookRepository;
        this.cartItemRepository = cartItemRepository;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public List<Book> searchBooks(String query) {
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(query, query);
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id).orElse(null);
    }

    public Book addBook(Book book) {
        return bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Long id, Book newData) {
        Book book = bookRepository.findById(id).orElse(null);
        if (book == null) {
            return null;
        }
        book.setTitle(newData.getTitle());
        book.setAuthor(newData.getAuthor());
        book.setPrice(newData.getPrice());
        return bookRepository.save(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        cartItemRepository.deleteAllByBook_Id(id);
        bookRepository.deleteById(id);
    }
}