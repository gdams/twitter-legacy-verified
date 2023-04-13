const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
app.use(express.json()); // Add this line to parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Add this line to serve static assets

app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in 15 minutes',
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Legacy Verified Users API',
      version: '1.0.0',
      description: 'A simple API to query legacy verified users',
    },
    servers: [
      {
        url: 'https://twitter-legacy.herokuapp.com',
      },
    ],
  },
  apis: ['./app.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Update the CSV parsing to include the new fields
let users = new Map();

fs.createReadStream('../legacy-verified.csv')
  .pipe(csvParser(['id', 'name', 'username']))
  .on('data', (row) => {
    users.set(row.username, { id: row.id, name: row.name });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search and filter users
 *     description: Search and filter users from the legacy-verified.csv file by name or username
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query for filtering users by name or username
 *     responses:
 *       200:
 *         description: A list of filtered users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 */
app.get('/api/users/search', limiter, (req, res) => {
  const query = req.query.q.toLowerCase();
  const filteredUsers = [];

  users.forEach((user, username) => {
    if (username.toLowerCase().includes(query) || user.name.toLowerCase().includes(query)) {
      filteredUsers.push({ username, id: user.id, name: user.name });
    }
  });

  res.status(200).json(filteredUsers);
});

// Update the API endpoint to return the new fields
/**
 * @swagger
 * /api/users/{username}:
 *   get:
 *     summary: Retrieve a user's information
 *     description: Retrieve a user's information from the legacy-verified.csv file
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username to query
 *     responses:
 *       200:
 *         description: The user's information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.get('/api/users/:username', limiter, (req, res) => {
  const username = req.params.username;
  if (users.has(username)) {
    const user = users.get(username);
    res.status(200).json({ username, id: user.id, name: user.name });
  } else {
    res.status(404).json({ error: 'User not in the legacy verified list' });
  }
});

app.get('/', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
