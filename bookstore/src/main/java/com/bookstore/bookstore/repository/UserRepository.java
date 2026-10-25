package com.bookstore.bookstore.repository;

import com.bookstore.bookstore.model.Role;
import com.bookstore.bookstore.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Provides username lookups and role checks for login and admin bootstrapping.
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRole(Role role);
}
