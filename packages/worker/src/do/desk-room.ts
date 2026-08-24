import { DurableObject } from 'cloudflare:workers';

/**
 * 桌位房间 Durable Object
 * 每个 (tenant, desk) 一个实例，管理该桌的 WebSocket 连接
 * 使用 Hibernation API 空闲时不计费
 */
export class DeskRoomDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/health') {
      return new Response('ok');
    }

    // HTTP 广播端点: 路由层通过 POST /broadcast 发送消息，DO 广播给所有 WS 客户端
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const message = await request.text();
      this.broadcast(message);
      return new Response('{"status":"broadcasted"}', {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // WebSocket 升级
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const role = url.searchParams.get('role') || 'customer';
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // 标记角色
    (server as any).__role = role;

    // 启用 Hibernation: 设置自动响应 ping/pong 心跳
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong')
    );

    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * 收到 WebSocket 消息
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'order:new':
        case 'order:status':
        case 'desk:status':
        case 'payment:done':
        case 'item:status':
          this.broadcast(message);
          break;
        default:
          // 其他消息也广播
          this.broadcast(message);
      }
    } catch (e) {
      console.error('WebSocket message parse error:', e);
    }
  }

  /**
   * 连接关闭
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }

  /**
   * 错误处理
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    ws.close(1011, 'WebSocket error');
  }

  /**
   * 向所有活跃连接广播消息
   */
  private broadcast(message: string): void {
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {
      try {
        ws.send(message);
      } catch (e) {
        console.error('Broadcast send error:', e);
      }
    }
  }
}
