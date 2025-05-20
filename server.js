// Just a simple server to test the app locally
// Run it with: node server.js
// Then go to: http://localhost:3000 in your browser

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// These tell the browser what type of file we're sending
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Set up the server to handle requests
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL to get the file path and query parameters
  const parsedUrl = url.parse(req.url, true);
  let filePath = parsedUrl.pathname;

  // Default to index.html if root path
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Handle URL with query parameters for countdown.html
  if (filePath.includes('countdown.html')) {
    filePath = '/countdown.html';
  }

  // Get the full path to the file
  const fullPath = path.join(__dirname, filePath);

  // Get the file extension
  const extname = path.extname(fullPath).toLowerCase();

  // Get the MIME type based on the file extension
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Read the file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        console.error(`File not found: ${fullPath}`);
        fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Fire it up!
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
});
