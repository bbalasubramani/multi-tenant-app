const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { getClient } = require('../db');

const app = express();
app.use(express.json());
app.use(cors());

//health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// A dummy database of test users
const testUsers = [
  { email: 'admin@acme.test', password: 'password', tenant: 'acme', role: 'admin' },
  { email: 'user@acme.test', password: 'password', tenant: 'acme', role: 'member' },
  { email: 'admin@globex.test', password: 'password', tenant: 'globex', role: 'admin' },
  { email: 'user@globex.test', password: 'password', tenant: 'globex', role: 'member' },
];


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = testUsers.find(u => u.email === email);
  if (!user || password !== user.password) { 
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { email: user.email, tenant: user.tenant, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token, tenant: user.tenant, role: user.role });
});


const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};


const roleMiddleware = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};


app.get('/notes', authMiddleware, async (req, res) => {
  const { tenant } = req.user;
  const client = await getClient(tenant);
  try {
    const result = await client.query('SELECT * FROM notes;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve notes' });
  } finally {
    await client.end();
  }
});


app.post('/notes', authMiddleware, roleMiddleware(['member', 'admin']), async (req, res) => {
  const { tenant, role } = req.user;
  const { content } = req.body;
  const client = await getClient(tenant);
  try {
    
    if (role === 'member') {
      const countResult = await client.query('SELECT COUNT(*) FROM notes;');
      if (parseInt(countResult.rows[0].count) >= 3) {
        return res.status(403).json({ message: 'Note limit reached for Free Plan.' });
      }
    }
    const result = await client.query('INSERT INTO notes(content) VALUES($1) RETURNING *;', [content]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create note' });
  } finally {
    await client.end();
  }
});


app.post('/tenants/:slug/upgrade', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { slug } = req.params;
  const { tenant } = req.user;
  if (slug !== tenant) {
    return res.status(403).json({ message: 'Forbidden' });
  }

 
  res.json({ message: `Tenant ${slug} has been upgraded to Pro Plan.` });
});

module.exports = app;