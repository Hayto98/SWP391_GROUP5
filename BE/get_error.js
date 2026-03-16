try {
  const ctrl = require('./src/controllers/Citizen/complaintController');
  console.log("Controller loaded!");
} catch (e) {
  console.log("Error inside controller:", e.toString());
}
