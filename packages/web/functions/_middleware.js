// Pages Functions: 将 /api 和 /ws 请求代理到 Worker
// 这样前端和 API 在同一个域名下，避免 CORS 问题

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // API 请求代理到 Worker
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    const workerUrl = `https://restaurant-worker.zbeve.workers.dev${url.pathname}${url.search}`;
    
    // WebSocket 请求
    if (url.pathname.startsWith('/ws/')) {
      const upgrade = context.request.headers.get('upgrade');
      if (upgrade === 'websocket') {
        return fetch(workerUrl, {
          method: context.request.method,
          headers: context.request.headers,
          body: context.request.body,
        });
      }
    }
    
    // 普通 HTTP 请求
    return fetch(workerUrl, {
      method: context.request.method,
      headers: context.request.headers,
      body: context.request.body,
    });
  }
  
  // 其他请求继续正常处理 (静态资源)
  return context.next();
}
