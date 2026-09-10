import { parseAbi } from 'viem';

export const DecentralizedMailABI = parseAbi([
  // Read
  "function aliasToAddress(string) view returns (address)",
  "function addressToAlias(address) view returns (string)",
  "function getMyAlias() view returns (string)",
  
  // Write
  "function registerAlias(string _alias)",
  "function sendMessage(string _toAlias, string _contentCID)",

  // Events
  "event AliasRegistered(address indexed user, string aliasName)",
  "event MessageSent(address indexed from, address indexed to, string contentCID, uint256 timestamp)"
]);

// BotChain Testnet Contract Address (can be overridden by NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local)
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xC0DE8FE984F889f8a7367BD1DE8DBBBFB05cE13a") as `0x${string}`;
export const DEPLOYMENT_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || "0");

export const EXPLORER_BASE_URL = "https://scan.bohr.life";
export const RPC_URL = "https://rpc.bohr.life";
export const CHAIN_ID = 968;

export function getExplorerAddressUrl(address: string) {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

export function getExplorerTxUrl(hash: string) {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}
