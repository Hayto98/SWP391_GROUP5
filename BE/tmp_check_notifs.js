const db = require('./src/config/database');
const fs = require('fs');

async function checkNotifications() {
  try {
    const [notifs] = await db.query('SELECT * FROM notification ORDER BY created_at DESC LIMIT 20');
    const [enterprises] = await db.query('SELECT user_account_id, email, role_id FROM useraccount WHERE role_id = 2');
    
    const results = {
      notifs,
      enterprises
    };
    
    fs.writeFileSync('tmp_db_results.json', JSON.stringify(results, null, 2));
    console.log('Results written to tmp_db_results.json');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNotifications();
