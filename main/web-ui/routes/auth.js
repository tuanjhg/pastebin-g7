const express = require('express');
const router = express.Router();
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/login', async (req, res) => {
  try {
    const { data } = await axios.post(`${USER_SERVICE_URL}/auth/login`, req.body);
    req.session.token = data.token;
    res.redirect('/');
  } catch (err) {
    res.render('login', { error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    await axios.post(`${USER_SERVICE_URL}/auth/register`, req.body);
    res.redirect('/login');
  } catch (err) {
    res.render('register', { error: 'Register failed' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
