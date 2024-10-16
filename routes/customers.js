const express = require('express');
const router = express.Router();
const db = require('../db');

// Tambahkan pelanggan menggunakan stored procedure
router.get('/', async (req, res) => {
  try {
    const [customers] = await db.query('SELECT * FROM customers');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/', async (req, res) => {
  const { name, phone_number, email } = req.body;
  try {
    const [result] = await db.query('CALL AddCustomer(?, ?, ?)', [name, phone_number, email]);
    res.status(201).json({ message: 'Customer added successfully', result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

router.get('/:customer_id/discount', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const [pointsResult] = await db.query('SELECT loyalty_points FROM customers WHERE customer_id = ?', [customer_id]);

    if (!pointsResult.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const loyaltyPoints = pointsResult[0].loyalty_points;
    const [discountResult] = await db.query('SELECT CalculateDiscount(?) AS discount', [loyaltyPoints]);

    res.json({ discount: discountResult[0].discount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate discount' });
  }
});



module.exports = router;
