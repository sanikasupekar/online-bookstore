package com.bookstore.bookstore.controller;

import com.bookstore.bookstore.model.Order;
import com.bookstore.bookstore.model.OrderStatus;
import com.bookstore.bookstore.service.OrderService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> placeOrder(Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(principal.getName()));
    }

    @GetMapping("/my")
    public List<Order> getMyOrders(Principal principal) {
        return orderService.getMyOrders(principal.getName());
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return orderService.updateStatus(id, request.status());
    }

    public record UpdateStatusRequest(OrderStatus status) {
    }
}
