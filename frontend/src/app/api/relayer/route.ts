import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { botchainTestnet } from '@/config';
import { CONTRACT_ADDRESS, DecentralizedMailABI } from '@/utils/abi';

const RELAYER_KEY = (process.env.BOTCHAIN_RELAYER_KEY || process.env.PRIVATE_KEY || '6ece124cd7edffc4a0938c1438cb97be5493a10fe1d92826facba6f91332beb1') as `0x${string}`;

const formattedKey = (RELAYER_KEY.startsWith('0x') ? RELAYER_KEY : `0x${RELAYER_KEY}`) as `0x${string}`;

export async function POST(request: Request) {
  try {
    const { action, toAlias, contentCID, alias } = await request.json();

    const account = privateKeyToAccount(formattedKey);

    const publicClient = createPublicClient({
      chain: botchainTestnet,
      transport: http('https://rpc.bohr.life')
    });

    const walletClient = createWalletClient({
      account,
      chain: botchainTestnet,
      transport: http('https://rpc.bohr.life')
    });

    if (action === 'sendMessage') {
      if (!toAlias || !contentCID) {
        return NextResponse.json({ error: 'Missing toAlias or contentCID' }, { status: 400 });
      }

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: DecentralizedMailABI,
        functionName: 'sendMessage',
        args: [toAlias, contentCID]
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        return NextResponse.json({ error: 'Relayed transaction reverted on-chain' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        sponsored: true,
        txHash: hash,
        relayer: account.address
      }, { status: 200 });
    }

    if (action === 'registerAlias') {
      if (!alias) {
        return NextResponse.json({ error: 'Missing alias' }, { status: 400 });
      }

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: DecentralizedMailABI,
        functionName: 'registerAlias',
        args: [alias]
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        return NextResponse.json({ error: 'Relayed alias registration reverted' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        sponsored: true,
        txHash: hash,
        relayer: account.address
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unsupported relayer action' }, { status: 400 });
  } catch (error: any) {
    console.error('Relayer Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to relay transaction' }, { status: 500 });
  }
}
