const fs = require('fs');
const core = fs.readFileSync('contracts/AIPCore.sol', 'utf8');
const pool = fs.readFileSync('contracts/RewardPool.sol', 'utf8');
fs.writeFileSync('server/contracts_context.txt', `\n\n// ----- AIPCore.sol -----\n${core}\n\n// ----- RewardPool.sol -----\n${pool}`);
console.log('Done');
