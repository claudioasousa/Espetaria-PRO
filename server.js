
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

// Servir arquivos estáticos do Build (Pasta dist)
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

pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado ao MySQL com sucesso!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no MySQL:', err.message);
  });

// --- API ROUTES ---

// Insumos de estoque
app.get('/api/inventory', async (req, res) => {
  try {
    // Fix: Mapping DB columns to match the InventoryItem interface in types.ts
    const [rows] = await pool.query('SELECT id, name, current_quantity as quantity, unit_of_measure as unit, min_stock_level as minStock FROM inventory');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE status != "PAGO" ORDER BY created_at DESC');
    const detailedOrders = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.query('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [order.id]);
      return { 
        ...order, 
        items,
        timestamp: order.created_at,
        tableNumber: order.table_number,
        total: parseFloat(order.total_amount)
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
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
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

// Redirecionar qualquer outra rota para o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor e App rodando em http://localhost:${PORT}`);
});
