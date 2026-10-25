package com.bookstore.bookstore.controller;

import com.bookstore.bookstore.model.CartItem;
import com.bookstore.bookstore.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartItem> getCartItems() {
        return cartService.getCartItems();
    }

    @PostMapping
    public CartItem addToCart(@RequestBody AddToCartRequest request) {
        return cartService.addToCart(request.bookId(), request.quantity());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromCart(@PathVariable Long id) {
        cartService.removeFromCart(id);
        return ResponseEntity.noContent().build();
    }

    public record AddToCartRequest(Long bookId, int quantity) {
    }
}
