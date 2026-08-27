const { createPublicClient, http, parseAbiItem } = require('viem');
const { celoSepolia } = require('viem/chains');

const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http("https://rpc.ankr.com/celo_sepolia")
});

async function main() {
  try {
    const currentBlock = await publicClient.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    const logs = await publicClient.getLogs({
      address: "0x96E3D3e36Feb6413eF649be189020F470c1fe742",
      event: parseAbiItem('event MessageSent(address indexed from, address indexed to, string contentCID, uint256 timestamp)'),
      fromBlock: 'earliest',
      toBlock: 'latest'
    });
    console.log("Logs:", logs.length);
  } catch (e) {
    console.error("Error fetching logs:", e.message);
  }
}

main();
