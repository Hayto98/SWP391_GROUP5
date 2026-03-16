const db = require('./src/config/database');
const fs = require('fs');

async function run() {
  try {
    const [rows] = await db.execute('DESCRIBE reportcomplaint');
    const [rows2] = await db.execute('DESCRIBE reportcomplaintattachment');
    fs.writeFileSync('tables.json', JSON.stringify({ reportcomplaint: rows, reportcomplaintattachment: rows2 }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
