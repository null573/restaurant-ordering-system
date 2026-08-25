/**
 * WebSocket 连接管理 composable
 * 连接 Durable Objects 实时同步
 *
 * tenantId / deskId 既支持普通字符串（同步已知时直接传入），
 * 也支持 Ref<string>（异步获取后填充，再调用 connect()）。
 */
import { type Ref } from 'vue';
export declare function useWebSocket(tenantId: string | Ref<string>, deskId: string | Ref<string>, role?: string): {
    connected: Ref<boolean, boolean>;
    messages: Ref<any[], any[]>;
    connect: () => void;
    send: (data: any) => void;
    disconnect: () => void;
};
//# sourceMappingURL=useWebSocket.d.ts.map