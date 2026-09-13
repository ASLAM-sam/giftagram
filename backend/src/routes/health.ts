import { jsonResponse, errorResponse } from '../utils/response';
import { Env } from '../env';

export async function handleHealthCheck(request: Request, env: Env): Promise<Response> {
  let dbStatus = 'disconnected';

  try {
    if (env.DB) {
      const result = await env.DB.prepare('SELECT 1 as healthy').first<{ healthy: number }>();
      if (result && result.healthy === 1) {
        dbStatus = 'connected';
      }
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  return jsonResponse({
    service: 'giftagram-api',
    status: 'healthy',
    environment: env.ENVIRONMENT || 'development',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
