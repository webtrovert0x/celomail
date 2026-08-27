'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { celoSepolia } from 'viem/chains'

// 1. Get projectId from https://cloud.reown.com
// ⚠️ REPLACE THIS WITH YOUR ACTUAL PROJECT ID
const projectId = ''

const hardhat = {
  id: 1337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] }, public: { http: ['http://127.0.0.1:8545'] } },
  blockExplorers: { default: { name: 'Localhost', url: '' } },
}

// 3. Create metadata
const metadata = {
  name: 'cmail',
  description: 'Decentralized Email Platform',
  url: 'http://localhost:3000', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create AppKit
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [celoSepolia],
  metadata,
  projectId,
  features: {
    analytics: true
  }
})

export function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
