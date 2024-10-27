const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5002;

app.use(bodyParser.json());
app.use(cors());

// Initialize the SQLite database
let db = new sqlite3.Database('./activity_logs.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create a table for logging activities if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    element_tag TEXT,
    element_text TEXT,
    url TEXT,
    timestamp TEXT,
    scroll_depth INTEGER
  )
`);

// Endpoint to log activity data
app.post('/log', (req, res) => {
  const activityData = req.body;

  // Extract relevant data
  const { eventType, elementTag, elementText = '', url = '', timestamp, scrollY = 0 } = activityData;

  // Log the extracted data
  console.log('Extracted Activity Data:', { eventType, elementTag, elementText, url, timestamp, scrollY });

  // Insert data into SQLite database
  db.run(
    `INSERT INTO activity_logs (event_type, element_tag, element_text, url, timestamp, scroll_depth)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [eventType, elementTag, elementText, url, timestamp, scrollY],
    (err) => {
      if (err) {
        console.error('Error inserting activity log:', err.message);
        return res.status(500).send('Failed to log activity');
      }

      res.status(200).send('Activity logged successfully');
    }
  );
});


// Start the Express server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
