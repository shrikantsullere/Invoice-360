const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/sales-statements',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + 'TOKEN_HERE' // I don't have a token easily, but let's see if it errors with 401 correctly
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
