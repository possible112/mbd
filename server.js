const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const db = require('./db');  // Assuming you have a db.js file to manage MySQL connection

// Function to run SQL file
const runSQLFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, 'utf-8');  // Read SQL file
  const connection = await db.getConnection();     // Get database connection
  try {
    await connection.query(sql);  // Execute the SQL file content
    console.log('SQL file executed successfully');
  } catch (error) {
    console.error('Error executing SQL file:', error);
  } finally {
    connection.release();  // Always release connection
  }
};

// Path to your SQL setup file
const sqlFilePath = path.join(__dirname, 'db', 'db_setup.sql');

// Call the function to run the SQL file during initialization
runSQLFile(sqlFilePath);

app.use(express.json());

// Import routes
const customerRoutes = require('./routes/customers');
const reservationRoutes = require('./routes/reservations');
const orderRoutes = require('./routes/orders');
const tableRoutes = require('./routes/tables')
app.use('/customers', customerRoutes);
app.use('/reservations', reservationRoutes);
app.use('/orders', orderRoutes);
app.use('/tables', tableRoutes)

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
