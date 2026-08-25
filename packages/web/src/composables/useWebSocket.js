/**
 * WebSocket 连接管理 composable
 * 连接 Durable Objects 实时同步
 *
 * tenantId / deskId 既支持普通字符串（同步已知时直接传入），
 * 也支持 Ref<string>（异步获取后填充，再调用 connect()）。
 */
import { ref, onUnmounted, unref } from 'vue';
export function useWebSocket(tenantId, deskId, role = 'customer') {
    const ws = ref(null);
    const connected = ref(false);
    const messages = ref([]);
    let pingInterval = null;
    let reconnectTimeout = null;
    function connect() {
        const tid = unref(tenantId);
        const did = unref(deskId);
        // 参数尚未就绪时不连接（等待异步获取后再调用 connect）
        if (!tid || !did)
            return;
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${location.host}/ws/desk/${tid}/${did}?role=${role}`;
        ws.value = new WebSocket(wsUrl);
        ws.value.onopen = () => {
            connected.value = true;
            // 心跳
            pingInterval = window.setInterval(() => {
                if (ws.value?.readyState === WebSocket.OPEN) {
                    ws.value.send('ping');
                }
            }, 30000);
        };
        ws.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'pong')
                    return; // 心跳响应
                messages.value.push(data);
                // 只保留最近 100 条
                if (messages.value.length > 100) {
                    messages.value = messages.value.slice(-100);
                }
            }
            catch { }
        };
        ws.value.onclose = () => {
            connected.value = false;
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }
            // 自动重连
            reconnectTimeout = window.setTimeout(connect, 3000);
        };
        ws.value.onerror = () => {
            connected.value = false;
        };
    }
    function send(data) {
        if (ws.value?.readyState === WebSocket.OPEN) {
            ws.value.send(JSON.stringify(data));
        }
    }
    function disconnect() {
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        ws.value?.close();
        ws.value = null;
        connected.value = false;
    }
    onUnmounted(disconnect);
    return { connected, messages, connect, send, disconnect };
}
//# sourceMappingURL=useWebSocket.js.map