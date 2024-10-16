const express = require('express');
const router = express.Router();
const db = require('../db');

// Membuat reservasi dengan transaksi
// Membuat reservasi dengan transaksi
router.post('/', async (req, res) => {
  const { customer_id, table_number, reservation_date, reservation_time, reservation_duration, status } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Cek apakah table_number terdaftar di tabel 'tables'
    const [existingTable] = await connection.query(
      'SELECT * FROM tables WHERE table_number = ?',
      [table_number]
    );

    if (existingTable.length === 0) {
      return res.status(404).json({ error: 'Table does not exist' });
    }

    // Cek apakah table_number sudah dipesan di tanggal dan waktu yang sama
    const [existingReservations] = await connection.query(
      'SELECT * FROM reservations WHERE table_number = ? AND reservation_date = ? AND reservation_time = ?',
      [table_number, reservation_date, reservation_time]
    );

    if (existingReservations.length > 0) {
      return res.status(409).json({ error: 'Table is already reserved for this date and time' });
    }

    // Hitung end_time berdasarkan reservation_time dan reservation_duration
    const reservationDurationInSeconds = reservation_duration * 60 * 60; // konversi jam ke detik
    const reservationDateTime = new Date(`${reservation_date}T${reservation_time}`);
    const endDateTime = new Date(reservationDateTime.getTime() + reservationDurationInSeconds * 1000);
    const end_time = endDateTime.toTimeString().split(' ')[0]; // Ambil waktu dalam format HH:MM:SS

    // Jika tidak ada bentrok, buat reservasi baru
    const [result] = await connection.query(
      'INSERT INTO reservations (customer_id, table_number, reservation_date, reservation_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, table_number, reservation_date, reservation_time, end_time, status]
    );

    // Tambahkan loyalty points untuk pelanggan
    const loyaltyPointsToAdd = 10; // Misalnya, menambahkan 10 poin untuk setiap reservasi
    await connection.query(
      'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE customer_id = ?',
      [loyaltyPointsToAdd, customer_id]
    );

    // Commit transaksi
    await connection.commit();
    res.status(201).json({ message: 'Reservation created successfully', result });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to create reservation', details: err.message });
  } finally {
    connection.release();
  }
});

// Mendapatkan semua reservasi
router.get('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [reservations] = await connection.query('SELECT * FROM reservations');
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  } finally {
    connection.release();
  }
});

// Mendapatkan reservasi berdasarkan ID
router.get('/:id', async (req, res) => {
  const reservationId = req.params.id;
  const connection = await db.getConnection();
  try {
    const [reservations] = await connection.query('SELECT * FROM reservations WHERE reservation_id = ?', [reservationId]);

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservations[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  } finally {
    connection.release();
  }
});

// Mengupdate status reservasi
router.put('/:id/status', async (req, res) => {
  const reservationId = req.params.id;
  const { status } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE reservations SET status = ? WHERE reservation_id = ?',
      [status, reservationId]
    );

    await connection.commit();
    res.json({ message: 'Reservation status updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to update reservation status' });
  } finally {
    connection.release();
  }
});

// Menghapus reservasi berdasarkan ID
router.delete('/:id', async (req, res) => {
  const reservationId = req.params.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existingReservation] = await connection.query(
      'SELECT * FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );

    if (existingReservation.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const [result] = await connection.query(
      'DELETE FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );

    await connection.commit();
    res.status(200).json({ message: 'Reservation deleted successfully', result });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reservation', details: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
