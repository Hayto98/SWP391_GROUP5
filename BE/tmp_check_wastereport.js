const db = require('./src/config/database');
const fs = require('fs');

async function run() {
  try {
    const [rows] = await db.execute('DESCRIBE wastereport');
    fs.writeFileSync('wastereport_schema.json', JSON.stringify(rows, null, 2));
    console.log('Schema written to wastereport_schema.json');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
