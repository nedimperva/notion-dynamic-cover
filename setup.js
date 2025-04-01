const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log('Created public directory');
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  console.log('Created .env file from example. Please update with your actual values.');
}

console.log('Setup complete! Next steps:');
console.log('1. Update the .env file with your Notion API key and database ID');
console.log('2. Run "npm install" to install dependencies');
console.log('3. Run "npm start" to start the server');
