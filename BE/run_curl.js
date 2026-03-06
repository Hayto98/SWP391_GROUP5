require('dotenv').config();
const { execSync, spawn } = require('child_process');
const path = require('path');
const db = require('./src/config/database');
const tokenService = require('./src/services/tokenService');

(async () => {
    let server;
    try {
        console.log("Generating token for ADMIN@GREENAPP.COM...");
        const [rows] = await db.execute('SELECT user_account_id, email, phone, role_id FROM USERACCOUNT WHERE email = ? LIMIT 1', ['ADMIN@GREENAPP.COM']);
        const user = rows[0];
        const accessTokenPayload = {
            sub: user.user_account_id,
            email: user.email,
            phone: user.phone,
            roleId: user.role_id
        };
        const token = tokenService.generateAccessToken(accessTokenPayload);

        server = spawn('node', [path.join(__dirname, 'src/index.js')]);
        server.stdout.on('data', (data) => console.log(`[SERVER_OUT]: ${data}`));
        server.stderr.on('data', (data) => console.error(`[SERVER_ERR]: ${data}`));

        await new Promise(r => setTimeout(r, 2000));

        console.log("Fetching my reports with cURL...");
        const curlOut = execSync(`curl -i http://localhost:3000/api/reports/my -H "Authorization: Bearer ${token}"`).toString();
        console.log("CURL OUTPUT:");
        console.log(curlOut);
        
    } catch(err) {
        console.error(err);
    } finally {
        if (server) server.kill();
        process.exit(0);
    }
})();
