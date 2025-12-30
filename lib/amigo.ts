import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// CONFIGURATION
const AMIGO_BASE = process.env.AMIGO_BASE_URL || 'https://amigo.ng/api'; 
const PROXY_URL = process.env.AWS_PROXY_URL; 
const API_KEY = process.env.AMIGO_API_KEY || '';

// Configure Proxy Agent
let httpsAgent: any = undefined;
if (PROXY_URL) {
    // This tunnels the connection through your AWS Squid Proxy
    httpsAgent = new HttpsProxyAgent(PROXY_URL);
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
 * Helper to call Amigo endpoints.
 * Routes traffic through the configured AWS Proxy.
 */
export async function callAmigoAPI(endpoint: string, payload: any, idempotencyKey?: string) {
  // 1. Sanitize Base URL (Remove trailing slash)
  const baseUrl = AMIGO_BASE.replace(/\/$/, '');
  
  // 2. Sanitize Endpoint (Ensure leading slash)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 3. Construct Full URL
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

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

export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};