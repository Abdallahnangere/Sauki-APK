import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// CONFIGURATION
// Ensure this ENV var includes the full path (e.g., https://amigo.ng/api/data)
const AMIGO_BASE = process.env.AMIGO_BASE_URL || 'https://amigo.ng/api'; 
const PROXY_URL = process.env.AWS_PROXY_URL; 
const API_KEY = process.env.AMIGO_API_KEY || '';

// Configure Proxy Agent
let httpsAgent: any = undefined;
if (PROXY_URL) {
    try {
        httpsAgent = new HttpsProxyAgent(PROXY_URL);
    } catch (e) {
        console.error("Failed to initialize Proxy Agent", e);
    }
}

export const amigoClient = axios.create({
  httpsAgent: httpsAgent,
  proxy: false, 
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`, 
    'Token': API_KEY, 
    'X-API-Key': API_KEY,
    'Accept': 'application/json',
  },
  timeout: 60000, 
});

/**
 * UPDATED MAPPING (Harmonized)
 * MTN=1, GLO=2, AIRTEL=4, 9MOBILE=9
 */
export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 4,  // Corrected from 3
  '9MOBILE': 9, // Corrected from 4
  'ETISALAT': 9
};

/**
 * Helper to call Amigo endpoints.
 * Signature: (payload, idempotencyKey) - Matches route.ts
 */
export async function callAmigoAPI(payload: any, idempotencyKey?: string) {
  // INTELLIGENT URL CONSTRUCTION
  // Just normalize the Base URL since the endpoint is implied to be in it
  let fullUrl = AMIGO_BASE.replace(/\/$/, '');

  console.log(`[Amigo Tunnel] 🚀 Requesting: ${fullUrl}`);
  // Added Payload log so you can debug the exact JSON being sent
  console.log(`[Amigo Tunnel] 📦 Payload:`, JSON.stringify(payload, null, 2));

  try {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await amigoClient.post(fullUrl, payload, { headers });
    
    console.log(`[Amigo Tunnel] ✅ Success: ${response.status}`);
    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[Amigo Tunnel] ❌ Failed: ${errorMsg}`);
    
    // Dump full error response if available for better debugging
    if (error.response?.data) {
        console.error(`[Amigo Tunnel] 🔍 API Response Dump:`, JSON.stringify(error.response.data));
    }
    
    return {
      success: false,
      data: error.response?.data || { error: errorMsg },
      status: error.response?.status || 500
    };
  }
}
