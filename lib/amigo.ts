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
 * Automatically handles URL construction to prevent duplication.
 */
export async function callAmigoAPI(endpoint: string, payload: any, idempotencyKey?: string) {
  // Normalize Base URL (remove trailing slash)
  let baseUrl = AMIGO_BASE.replace(/\/$/, '');
  
  // Normalize Endpoint (ensure leading slash)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // INTELLIGENT URL CONSTRUCTION
  // If base URL already ends with the first part of the endpoint, do not append it again.
  // Example: Base '.../api/data' and Endpoint '/data/' -> Keep '.../api/data'
  let fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  if (cleanEndpoint === '/data/' || cleanEndpoint === '/data') {
      if (baseUrl.endsWith('/data')) {
          fullUrl = baseUrl; // Base already includes the endpoint
      } else if (baseUrl.endsWith('/data/')) {
           fullUrl = baseUrl.slice(0, -1); // Remove trailing slash from base
      }
  }

  console.log(`[Amigo Tunnel] 🚀 Requesting: ${fullUrl}`);

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

export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};