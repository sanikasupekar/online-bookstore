package com.bookstore.bookstore.repository;

import com.bookstore.bookstore.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findAllByUser_Username(String username);

    Optional<CartItem> findByUser_UsernameAndBook_Id(String username, Long bookId);

    void deleteAllByBook_Id(Long bookId);

    void deleteAllByUser_Username(String username);
}
