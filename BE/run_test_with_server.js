const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [path.join(__dirname, 'src/index.js')]);

server.stdout.on('data', (data) => console.log(`[SERVER_OUT]: ${data}`));
server.stderr.on('data', (data) => console.error(`[SERVER_ERR]: ${data}`));

setTimeout(() => {
    const test = spawn('node', ['test_get_reports.js']);
    test.stdout.on('data', (data) => console.log(`[TEST_OUT]: ${data}`));
    test.stderr.on('data', (data) => console.log(`[TEST_ERR]: ${data}`));
    
    test.on('close', () => {
        setTimeout(() => {
            server.kill();
            process.exit();
        }, 1000);
    });
}, 2000);
