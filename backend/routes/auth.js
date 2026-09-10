const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { query } = require('../db/postgres');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'game_on_super_secret_jwt_key_2026';

// Register Route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        // Check if user exists
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name.trim(), email.toLowerCase().trim(), hashedPassword]
        );

        const newUser = result.rows[0];

        // Generate token
        const token = jwt.sign({ userId: newUser.id, id: newUser.id }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: newUser.id.toString(),
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ msg: 'Server error during registration' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password required' });
        }

        const userResult = await query(
            'SELECT id, name, email, password FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, id: user.id }, JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({
            token,
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: 'Server error during login' });
    }
});

// Verify Route
router.get('/verify', auth, async (req, res) => {
    try {
        const userResult = await query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const user = userResult.rows[0];
        res.json({
            id: user.id.toString(),
            name: user.name,
            email: user.email
        });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ msg: 'Server error during verification' });
    }
});

module.exports = router;
