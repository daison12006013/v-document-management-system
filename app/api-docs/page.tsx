'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the swagger spec from the API route
    fetch('/api/swagger')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load spec: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        setSpec(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Swagger spec:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading API Documentation...</h1>
          <p className="text-gray-600">Please wait while we load the Swagger specification.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return null;
  }

  return (
    <div className="api-docs-container">
      <SwaggerUI
        spec={spec}
        deepLinking={true}
        displayOperationId={false}
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        docExpansion="list"
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
        tryItOutEnabled={true}
        requestInterceptor={(request: any) => {
          // Add CSRF token if available
          const csrfToken = document.cookie
            .split('; ')
            .find((row) => row.startsWith('csrf-token='))
            ?.split('=')[1];

          if (csrfToken) {
            request.headers['X-CSRF-Token'] = csrfToken;
          }

          // Ensure credentials are included for cookie-based auth
          request.credentials = 'include';

          return request;
        }}
      />
    </div>
  );
}

