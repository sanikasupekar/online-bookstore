package com.bookstore.bookstore.controller;

import com.bookstore.bookstore.model.CartItem;
import com.bookstore.bookstore.service.CartService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartItem> getCartItems(Principal principal) {
        return cartService.getCartItems(principal.getName());
    }

    @PostMapping
    public CartItem addToCart(@RequestBody AddToCartRequest request, Principal principal) {
        return cartService.addToCart(principal.getName(), request.bookId(), request.quantity());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromCart(@PathVariable Long id, Principal principal) {
        cartService.removeFromCart(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    public record AddToCartRequest(Long bookId, Integer quantity) {
    }
}
