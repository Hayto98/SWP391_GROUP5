const crypto = require('crypto');

async function verify() {
  const phone = '0' + crypto.randomInt(100000000, 999999999).toString();
  const password = 'password123';
  const fullname = 'Test User ' + phone;
  const email = `testuser${phone}@example.com`; // Still required by schema but secondary now
  const roleId = 'customer'; // Assuming 'customer' role exists, or maybe 1 or 2. Let's try to check schema or existing data.
  // Actually, let's use a hardcoded roleId if we know one, or just try 'customer' and hope validation doesn't fail on roleId.
  // Wait, in authService: `if (error.code === 'ER_NO_REFERENCED_ROW_2') { throw new ApiError(400, 'Provided roleId does not exist') }`
  // I need a valid roleId. let's check userRepository or DB if possible.
  // I'll try to find a valid roleId from existing users or guess 1.
  
  // Let's assume role_id 1 exists (usually admin or customer).
  // Or I can read `roleMiddleware.js` to see used roles.
  
  const payloadRegister = {
    fullname,
    email,
    phone,
    password,
    roleId: 2 // Trying 2 for customer, or 1.
  };

  console.log('--- Registering ---');
  console.log('Payload:', payloadRegister);
  
  try {
    const resReg = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadRegister)
    });
    
    const dataReg = await resReg.json();
    console.log('Status:', resReg.status);
    console.log('Response:', dataReg);

    if (!resReg.ok) {
        console.error('Registration failed');
        // If roleId failed, might need to adjust.
        return;
    }

    console.log('\n--- Logging in ---');
    const payloadLogin = {
        phone,
        password
    };
    console.log('Payload:', payloadLogin);

    const resLogin = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadLogin)
    });
    
    const dataLogin = await resLogin.json();
    console.log('Status:', resLogin.status);
    console.log('Response:', dataLogin);
    
    if (resLogin.ok && dataLogin.tokens && dataLogin.user.phone === phone) {
        console.log('\nSUCCESS: Phone login verified!');
    } else {
        console.error('\nFAILURE: Login failed or phone mismatch');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

verify();
