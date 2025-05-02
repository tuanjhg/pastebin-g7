require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/paste.routes');

app.use(express.json());
app.use('/', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});