package com.bookstore.bookstore.repository;

import com.bookstore.bookstore.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByBook_Id(Long bookId);

    void deleteAllByBook_Id(Long bookId);
}
