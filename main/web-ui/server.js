// const express = require('express');
// const session = require('express-session');
// const dotenv = require('dotenv');
// const path = require('path');

// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 3000;
// const { connectRabbitMQ } = require('./services/rabbitmq');

// connectRabbitMQ()
//     .then(() => console.log('Web UI connected to RabbitMQ'))
//     .catch(err => console.error('RabbitMQ connection failed:', err));



// // Middleware
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     if (process.env.NODE_ENV === 'development') {
//       res.status(500).send(`<pre>${err.stack}</pre>`);
//     } else {
//       res.status(500).send('Lỗi máy chủ.');
//     }
//   });
  
// // View engine
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// // Static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Routes
// app.use('/', require('./routes/auth'));
// app.use('/', require('./routes/paste'));


// app.listen(PORT, () => console.log(`Web UI running on http://localhost:${PORT}`));
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const { initPubSub } = require('./services/pubsub');

// Khởi tạo kết nối Pub/Sub
initPubSub()
    .then(() => console.log('✅ Web UI connected to Google Cloud Pub/Sub'))
    .catch(err => {
        console.error('❌ Pub/Sub connection failed:', err);
        // Không exit process, vẫn cho phép app chạy với HTTP fallback
    });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ 
    secret: 'secret',
    resave: false, 
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'development'
    }
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (process.env.NODE_ENV === 'development') {
        res.status(500).send(`<pre>${err.stack}</pre>`);
    } else {
        res.status(500).send('Internal Server Error');
    }
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'web-ui'
    });
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/paste'));

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found',
        code: 404
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Web UI running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});