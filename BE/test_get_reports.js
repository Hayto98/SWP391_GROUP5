const db = require('./src/config/database');
const tokenService = require('./src/services/tokenService');

(async () => {
    try {
        console.log("Generating token for ADMIN@GREENAPP.COM...");
        
        const [rows] = await db.execute('SELECT user_account_id, email, phone, role_id FROM USERACCOUNT WHERE email = ? LIMIT 1', ['ADMIN@GREENAPP.COM']);
        const user = rows[0];
        
        if (!user) {
            console.log("User not found");
            process.exit(1);
        }

        const accessTokenPayload = {
            sub: user.user_account_id,
            email: user.email,
            phone: user.phone,
            roleId: user.role_id
        };

        const token = tokenService.generateAccessToken(accessTokenPayload);
        console.log("Generated token:", token);

        console.log("Fetching my reports...");
        const myReportsRes = await fetch('http://localhost:3000/api/reports/my', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const textOut = await myReportsRes.text();
        console.log("RAW OUT:", textOut);
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
})();
