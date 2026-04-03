/**
 * Security utilities for TheraDoc
 */

// 1. PII Scrubber
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
  /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
];

export function scrubPII(text: string): { scrubbed: string; hasPII: boolean } {
  let scrubbed = text;
  let hasPII = false;
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(scrubbed)) {
      hasPII = true;
      scrubbed = scrubbed.replace(pattern, "[REDACTED]");
    }
  }
  return { scrubbed, hasPII };
}

// 2. Client-Side Encryption for sessionStorage
const ENCRYPTION_KEY_NAME = 'theradoc_encryption_key';

async function getEncryptionKey(): Promise<CryptoKey> {
  const key = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  if (key) {
    // In a real app, you'd securely store/retrieve this.
    // For this client-side demo, we'll derive it from a fixed secret or store it in memory.
    // WARNING: This is a simplified approach for demonstration.
  }
  
  // Generate a new key for this session if not exists
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: string): Promise<{ iv: Uint8Array; encrypted: ArrayBuffer }> {
  const key = await getEncryptionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return { iv, encrypted };
}
