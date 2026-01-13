
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'qwe123',
  database: process.env.DB_NAME || 'espetaria_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- API ROUTES ---

app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, CAST(current_quantity AS FLOAT) as quantity, unit_of_measure as unit, CAST(min_stock_level AS FLOAT) as minStock FROM inventory');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.id, p.name, CAST(p.price AS FLOAT) as price, c.name as category, p.stock_quantity as stock FROM products p LEFT JOIN categories c ON p.category_id = c.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables ORDER BY number ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE status != "PAGO" ORDER BY created_at DESC');
    const detailedOrders = await Promise.all(orders.map(async (order) => {
      // Modificado para incluir c.name as category
      const [items] = await pool.query(`
        SELECT 
          oi.id, 
          oi.product_id as productId, 
          p.name, 
          oi.quantity, 
          CAST(oi.unit_price AS FLOAT) as price,
          c.name as category
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      return { 
        ...order, 
        items,
        timestamp: order.created_at,
        tableNumber: order.table_number,
        total: parseFloat(order.total_amount) || 0
      };
    }));
    res.json(detailedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, tableNumber, items, total } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE tables SET status = "OCCUPIED" WHERE number = ?', [tableNumber]);
    await connection.query(
      'INSERT INTO orders (id, table_number, total_amount, status) VALUES (?, ?, ?, "PENDENTE")',
      [id, tableNumber, total]
    );
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [id, item.productId, item.quantity, item.price]
      );
    }
    await connection.commit();
    res.status(201).json({ message: 'Pedido criado' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, payment_method, amount_paid } = req.body;
  try {
    await pool.query(
      'UPDATE orders SET status = ?, payment_method = ?, amount_paid = ? WHERE id = ?', 
      [status, payment_method || null, amount_paid || null, id]
    );
    if (status === 'PAGO') {
      const [order] = await pool.query('SELECT table_number FROM orders WHERE id = ?', [id]);
      if (order.length > 0) {
        await pool.query('UPDATE tables SET status = "AVAILABLE" WHERE number = ?', [order[0].table_number]);
      }
    }
    res.json({ message: 'Status atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor e App rodando em http://localhost:${PORT}`);
});
