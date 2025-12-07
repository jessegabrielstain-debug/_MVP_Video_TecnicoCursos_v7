const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '../estudio_ia_videos/.env.local');
console.log('Reading env from:', envPath);
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env = {};
envConfig.split('\n').forEach((line) => {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) return;
  
  const match = trimmedLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

console.log('Loaded keys:', Object.keys(env));


const client = new Client({
  connectionString: env.DIRECT_DATABASE_URL,
});

console.log('Connecting to:', env.DIRECT_DATABASE_URL);

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then((res) => {
    console.log('Time:', res.rows[0]);
    return client.end();
  })
  .catch((err) => {
    console.error('Connection error:', err);
    process.exit(1);
  });
