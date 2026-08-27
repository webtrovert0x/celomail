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

// We will update this address once we deploy the contract to Sepolia
export const CONTRACT_ADDRESS = "0x96E3D3e36Feb6413eF649be189020F470c1fe742";
export const DEPLOYMENT_BLOCK = BigInt("34499000");
