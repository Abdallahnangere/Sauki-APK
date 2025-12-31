import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// CONFIGURATION
// User Instruction: The URL in the environment variable HAS the endpoint.
const AMIGO_FULL_URL = process.env.AMIGO_BASE_URL || 'https://amigo.ng/api/data/'; 
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
 * Helper to call Amigo endpoints.
 * Uses the AMIGO_BASE_URL environment variable strictly as the target URL.
 */
export async function callAmigoAPI(endpoint: string, payload: any, idempotencyKey?: string) {
  
  // We ignore the 'endpoint' argument here because the user specified
  // that the Environment Variable contains the full endpoint URL.
  const fullUrl = AMIGO_FULL_URL;

  console.log(`[Amigo Tunnel] 🚀 Requesting: ${fullUrl}`);
  console.log(`[Amigo Tunnel] 📦 Payload:`, JSON.stringify(payload));

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
    
    return {
      success: false,
      data: error.response?.data || { error: errorMsg },
      status: error.response?.status || 500
    };
  }
}

// User Specification: 1 for MTN, 2 for GLO.
export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};