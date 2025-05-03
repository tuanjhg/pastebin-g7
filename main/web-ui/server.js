const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const { connectRabbitMQ } = require('./services/rabbitmq');

connectRabbitMQ()
    .then(() => console.log('Web UI connected to RabbitMQ'))
    .catch(err => console.error('RabbitMQ connection failed:', err));



// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (process.env.NODE_ENV === 'development') {
      res.status(500).send(`<pre>${err.stack}</pre>`);
    } else {
      res.status(500).send('Lỗi máy chủ.');
    }
  });
  
// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/paste'));


app.listen(PORT, () => console.log(`Web UI running on http://localhost:${PORT}`));
