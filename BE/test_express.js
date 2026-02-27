const express = require('express');

const app = express();
const port = 3005;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Test app listening on port ${port}`);
});

process.on('exit', (code) => {
  console.log(`Test app about to exit with code: ${code}`);
});
