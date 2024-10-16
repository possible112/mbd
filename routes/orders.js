const express = require('express');
const router = express.Router();
const db = require('../db');


router.post('/order', async (req, res) => {
    const { customerId, menuId, quantity } = req.body;

    try {
        // Memulai transaksi
        await db.beginTransaction();

        // Menambah pesanan
        const insertOrderQuery = 'INSERT INTO orders (reservation_id, menu_id, quantity, total_price) VALUES (?, ?, ?, ?)';
        const totalPrice = await calculateTotalPrice(menuId, quantity); // Anda harus mengimplementasikan fungsi ini
        await db.query(insertOrderQuery, [reservationId, menuId, quantity, totalPrice]);

        // Mengupdate poin loyalitas jika perlu
        const updateLoyaltyQuery = 'UPDATE customers SET loyalty_points = loyalty_points + 10 WHERE customer_id = ?';
        await db.query(updateLoyaltyQuery, [customerId]);

        // Commit transaksi
        await db.commit();
        res.status(201).json({ message: 'Order placed successfully' });
    } catch (error) {
        // Rollback transaksi jika terjadi error
        await db.rollback();
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;