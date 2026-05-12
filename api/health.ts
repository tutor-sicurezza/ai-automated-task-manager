export const runtime = 'edge';

export default function handler() {
  return Response.json({
    ok: true,
    service: 'spark-template-backend',
    timestamp: new Date().toISOString(),
  });
}
