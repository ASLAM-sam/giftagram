/**
 * Consistent API Response and CORS Utilities
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function jsonResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    } as ApiSuccessResponse<T>),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      },
    }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: any,
  headers: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message,
        details,
      },
    } as ApiErrorResponse),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      },
    }
  );
}

/**
 * Computes secure CORS headers based on request Origin and allowed configuration
 */
export function getCorsHeaders(
  request: Request,
  allowedOriginsConfig?: string
): Record<string, string> {
  const origin = request.headers.get('Origin');

  // Default allowed origins for local dev and Cloudflare preview
  const defaultAllowed = [
    'https://giftagram-frontend.hydpurefumes.workers.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:5173',
  ];

  const configured = allowedOriginsConfig
    ? allowedOriginsConfig.split(',').map((o) => o.trim())
    : [];

  const allowedList = [...defaultAllowed, ...configured];

  const allowOrigin = origin && allowedList.includes(origin) ? origin : allowedList[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}
