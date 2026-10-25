package com.bookstore.bookstore.service;

import com.bookstore.bookstore.model.CartItem;
import com.bookstore.bookstore.model.Order;
import com.bookstore.bookstore.model.OrderItem;
import com.bookstore.bookstore.model.OrderStatus;
import com.bookstore.bookstore.model.User;
import com.bookstore.bookstore.repository.CartItemRepository;
import com.bookstore.bookstore.repository.OrderRepository;
import com.bookstore.bookstore.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Order placeOrder(String username) {
        List<CartItem> cartItems = cartItemRepository.findAllByUser_Username(username);
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot place an order with an empty cart");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Order order = new Order();
        order.setUser(user);
        double totalPrice = 0;
        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setBook(cartItem.getBook());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPriceAtPurchase(cartItem.getBook().getPrice());
            order.getItems().add(orderItem);
            totalPrice += orderItem.getPriceAtPurchase() * orderItem.getQuantity();
        }
        order.setTotalPrice(totalPrice);

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteAllByUser_Username(username);
        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<Order> getMyOrders(String username) {
        return orderRepository.findAllByUser_UsernameOrderByCreatedAtDesc(username);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional
    public Order updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status is required");
        }
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
