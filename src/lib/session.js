const encoder = new TextEncoder();

async function getCryptoKey(secret) {
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Signs a payload to create a session token using Web Crypto API.
 * @param {object} payload 
 * @returns {Promise<string>}
 */
export async function signSession(payload) {
  const secret = process.env.SESSION_SECRET || "booth_pos_session_secret_key_12345";
  const data = JSON.stringify(payload);
  const dataBase64 = btoa(encodeURIComponent(data));
  
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(dataBase64));
  const signatureHex = arrayBufferToHex(signatureBuffer);
  
  return `${dataBase64}.${signatureHex}`;
}

/**
 * Verifies a session token using Web Crypto API.
 * @param {string} token 
 * @returns {Promise<object|null>}
 */
export async function verifySession(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    
    const [dataBase64, signatureHex] = parts;
    const secret = process.env.SESSION_SECRET || "booth_pos_session_secret_key_12345";
    
    const key = await getCryptoKey(secret);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBuffer(signatureHex),
      encoder.encode(dataBase64)
    );
    
    if (!isValid) return null;
    
    const decodedData = decodeURIComponent(atob(dataBase64));
    const payload = JSON.parse(decodedData);
    
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}
