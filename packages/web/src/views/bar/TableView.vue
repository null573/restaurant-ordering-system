<template>
  <div class="table-view page">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <!-- 首屏加载 -->
      <div v-if="!firstLoaded" class="loading-box">
        <van-loading>加载中...</van-loading>
      </div>

      <!-- 桌位网格 -->
      <div v-else-if="desks.length" class="desk-grid">
        <div
          v-for="desk in desks"
          :key="desk.id"
          class="desk-card"
          :class="statusClass(desk.status)"
          @click="onDeskClick(desk)"
        >
          <div class="desk-head">
            <span class="desk-no">{{ desk.name || ('桌号 ' + desk.number) }}</span>
            <span class="desk-status">{{ statusText(desk.status) }}</span>
          </div>
          <div class="desk-cap">容量 {{ desk.capacity }} 人</div>
          <div class="desk-meta">
            <span>订单 {{ desk.active_orders }} 单</span>
            <span class="desk-amount">¥{{ fenToYuan(desk.total_fen) }}</span>
          </div>
        </div>
      </div>

      <van-empty v-else description="暂无桌位，请先在「管理 - 桌位管理」中添加" />
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { deskApi } from '../../api';
import { useWebSocket } from '../../composables/useWebSocket';
import { fenToYuan } from '../../utils/qrcode';
import { PullRefresh as VanPullRefresh, Empty as VanEmpty, Loading as VanLoading, showToast } from 'vant';

const router = useRouter();

// 从 localStorage 获取 userInfo.tenantId
function readTenantId(): string {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}').tenantId || '';
  } catch {
    return '';
  }
}
const tenantId = readTenantId();

const desks = ref<any[]>([]);
const refreshing = ref(false);
const firstLoaded = ref(false);

// 获取所有桌位状态
// 响应拦截器已返回 { code, message, data }，故 res.data 即桌位数组
async function fetchStatus() {
  try {
    const res: any = await deskApi.getStatus();
    desks.value = res.data || [];
  } catch {
    // 网络错误时保留上次数据，不打断轮询
  } finally {
    firstLoaded.value = true;
    refreshing.value = false;
  }
}

function statusClass(status: string) {
  if (status === 'occupied') return 'status-occupied';
  if (status === 'paying') return 'status-paying';
  return 'status-idle';
}

function statusText(status: string) {
  if (status === 'occupied') return '有顾客';
  if (status === 'paying') return '结账中';
  return '空闲';
}

function onDeskClick(desk: any) {
  if (desk.status === 'idle') {
    showToast('空桌');
  } else {
    // 有顾客 / 结账中 -> 跳转结算（传递 deskId，页面内查找活跃订单）
    router.push(`/bar/settlement/${desk.id}`);
  }
}

function onRefresh() {
  refreshing.value = true;
  fetchStatus();
}

// ===== 实时刷新 =====
// 为避免为每个桌位建立过多 WS 连接，使用单一租户级 WS 推送通道 + 5 秒轮询。
// 轮询为可靠的主刷新机制；WS 事件到达时立即触发刷新。
let pollTimer: number | null = null;
const { messages, connect, disconnect } = useWebSocket(tenantId, 'all', 'bar');

watch(
  () => messages.value.length,
  () => {
    const latest = messages.value[messages.value.length - 1];
    if (!latest) return;
    if (
      ['order:new', 'order:status', 'desk:status', 'payment:done'].includes(latest.type)
    ) {
      fetchStatus();
    }
  }
);

onMounted(() => {
  fetchStatus();
  // 仅在已登录（有 tenantId）时建立 WS 推送通道
  if (tenantId) connect();
  pollTimer = window.setInterval(fetchStatus, 5000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  disconnect();
});
</script>

<style scoped>
.table-view {
  padding: 12px;
}
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}
.desk-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.desk-card {
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow);
  min-height: 108px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.desk-card:active {
  transform: scale(0.97);
}
.desk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 16px;
}
.desk-status {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.85;
}
.desk-cap {
  font-size: 12px;
  opacity: 0.85;
}
.desk-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
.desk-amount {
  font-weight: 700;
  font-size: 15px;
}
/* 状态色使用全局 CSS 变量定义的类（.status-idle/.status-occupied/.status-paying） */
</style>
