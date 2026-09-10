// src/utils/crypto.ts
import { verifyMessage } from 'viem';

export interface DecryptedPayload {
  text: string;
  attachmentCID?: string;
  signature?: string;
  isVerified?: boolean;
}

/**
 * For this prototype, we derive a shared symmetric AES key deterministically 
 * from the sender and recipient addresses. 
 * 
 * In a production environment, you would use:
 * 1. Lit Protocol for decentralized access control
 * 2. Or ECIES asymmetric encryption using the recipient's public key.
 */

async function getSharedKey(sender: string, recipient: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // We sort addresses to ensure sender and recipient generate the same shared key
  const addresses = [sender.toLowerCase(), recipient.toLowerCase()].sort().join("");
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(addresses + "_mailora_secret"),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("mailora_salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(message: string, senderAddress: string, recipientAddress: string): Promise<string> {
  const key = await getSharedKey(senderAddress, recipientAddress);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);

  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedMessage
  );

  // Combine IV and Encrypted content to store in IPFS
  const encryptedBytes = new Uint8Array(encryptedContent);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);

  // Convert to Base64 for easy JSON storage in IPFS
  return btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(encryptedBase64: string, senderAddress: string, recipientAddress: string): Promise<DecryptedPayload> {
  try {
    const key = await getSharedKey(senderAddress, recipientAddress);
    const combinedString = atob(encryptedBase64);
    const combined = new Uint8Array(combinedString.length);
    for (let i = 0; i < combinedString.length; i++) {
      combined[i] = combinedString.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const encryptedBytes = combined.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedBytes
    );

    const decodedString = new TextDecoder().decode(decryptedContent);
    
    try {
      const payload = JSON.parse(decodedString);
      let isVerified = false;
      if (payload.signature && payload.text) {
         try {
           isVerified = await verifyMessage({ 
             address: senderAddress as `0x${string}`, 
             message: payload.text, 
             signature: payload.signature as `0x${string}` 
           });
         } catch(e) {
           console.error("Signature verification failed", e);
         }
      }
      return { ...payload, isVerified };
    } catch(e) {
      // V1 fallback
      return { text: decodedString, isVerified: false };
    }
  } catch (error) {
    console.warn("Decryption failed:", error);
    return { text: "Error: Could not decrypt message. You do not have the correct key.", isVerified: false };
  }
}
