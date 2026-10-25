package com.bookstore.bookstore.repository;

import com.bookstore.bookstore.model.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"user", "items", "items.book"})
    List<Order> findAllByUser_UsernameOrderByCreatedAtDesc(String username);

    @Override
    @EntityGraph(attributePaths = {"user", "items", "items.book"})
    List<Order> findAll();
}
