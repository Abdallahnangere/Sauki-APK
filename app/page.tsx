'use client';

import dynamic from 'next/dynamic';

// Dynamically import the main App component to ensure it only runs on the client
// This prevents hydration mismatches with the simplified index.tsx approach
const App = dynamic(() => import('../App'), { ssr: false });

export default function Page() {
  return <App />;
}