const express = require('express');
const fs = require('fs');
const csvParser = require('csv-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();

app.use(cors());

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
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Update the CSV parsing to include the new fields
let users = new Map();

fs.createReadStream('legacy-verified.csv')
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
app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  if (users.has(username)) {
    const user = users.get(username);
    res.status(200).json({ username, id: user.id, name: user.name });
  } else {
    res.status(404).json({ error: 'User not in the legacy verified list' });
  }
});
