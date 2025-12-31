import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// CONFIGURATION
const AMIGO_BASE = process.env.AMIGO_BASE_URL || 'https://amigo.ng/api'; 
const PROXY_URL = process.env.AWS_PROXY_URL; 
const API_KEY = process.env.AMIGO_API_KEY || '';

// Configure Proxy Agent
let httpsAgent: any = undefined;
if (PROXY_URL) {
    try {
        // This tunnels the connection through your AWS Squid Proxy
        httpsAgent = new HttpsProxyAgent(PROXY_URL);
    } catch (e) {
        console.error("Failed to initialize Proxy Agent", e);
    }
}

// Create Axios Instance with cleaner config
export const amigoClient = axios.create({
  httpsAgent: httpsAgent,
  proxy: false, // Must be false to let HttpsProxyAgent handle it
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`, 
    'Token': API_KEY, 
    'X-API-Key': API_KEY, // Sending key in multiple headers to ensure compatibility
    'Accept': 'application/json',
  },
  timeout: 60000, 
});

/**
 * NETWORK MAPPING (Crosscheck Verification)
 * This object maps the string values from your DB/UI ('MTN', 'AIRTEL')
 * to the specific integer IDs required by the Amigo API.
 */
export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,      // User selects MTN -> Sends 1
  'GLO': 2,      // User selects GLO -> Sends 2
  'AIRTEL': 3,   // User selects AIRTEL -> Sends 3
  '9MOBILE': 4
};

/**
 * Helper to call Amigo endpoints.
 * Routes traffic through the configured AWS Proxy.
 */
export async function callAmigoAPI(payload: any, idempotencyKey?: string, endpoint: string = '') {
  // 1. Sanitize Base URL (Remove trailing slash)
  const baseUrl = AMIGO_BASE.replace(/\/$/, '');
  
  // 2. Prepare Path (only add slash if endpoint exists)
  let path = '';
  if (endpoint) {
    path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // 3. Construct Full URL
  const fullUrl = `${baseUrl}${path}`;

  console.log(`[Amigo Tunnel] 🚀 Requesting: ${fullUrl} via ${PROXY_URL ? 'Proxy' : 'Direct'}`);

  try {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    // Important: We pass the full URL. HttpsProxyAgent handles the CONNECT method.
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
