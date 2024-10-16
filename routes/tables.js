const express = require('express');
const router = express.Router();
const db = require('../db');

// Add a new table
router.post('/', async (req, res) => {
  const { table_number, availability_status } = req.body;

  try {
    const connection = await db.getConnection();
    await connection.query(
      'INSERT INTO tables (table_number, availability_status) VALUES (?, ?)',
      [table_number, availability_status]
    );
    connection.release();
    res.status(201).json({ message: 'Table added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add table' });
  }
});

// Get all tables
router.get('/', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [tables] = await connection.query('SELECT * FROM tables');
    connection.release();
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get a single table by table number
router.get('/:table_number', async (req, res) => {
  const { table_number } = req.params;

  try {
    const connection = await db.getConnection();
    const [table] = await connection.query('SELECT * FROM tables WHERE table_number = ?', [table_number]);
    connection.release();

    if (table.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(table[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

// Update table availability status
router.put('/:table_number', async (req, res) => {
  const { table_number } = req.params;
  const { availability_status } = req.body;

  try {
    const connection = await db.getConnection();
    const [result] = await connection.query(
      'UPDATE tables SET availability_status = ? WHERE table_number = ?',
      [availability_status, table_number]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// Delete a table
router.delete('/:table_number', async (req, res) => {
  const { table_number } = req.params;

  try {
    const connection = await db.getConnection();
    const [result] = await connection.query('DELETE FROM tables WHERE table_number = ?', [table_number]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

module.exports = router;
