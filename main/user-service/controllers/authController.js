const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const register = (req, res) => {
  const { username, email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: 'Error hashing password' });
    userModel.createUser(username, email, hash, (err, result) => {
      if (err) return res.status(500).json({ message: 'Error creating user', error: err });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

const login = (req, res) => {
  const { username, password } = req.body;
  userModel.findUserByUsername(username, (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    });
  });
};

const getMe = (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
};

module.exports = { register, login, getMe };
