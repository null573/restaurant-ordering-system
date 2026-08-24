<template>
  <div class="page status-page">
    <!-- 顶部导航 -->
    <div class="status-header">
      <span class="back-btn" @click="goMenu">
        <van-icon name="arrow-left" size="18" />
      </span>
      <span class="header-title">订单进度</span>
      <span class="header-placeholder"></span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <van-loading>查询订单中...</van-loading>
    </div>

    <!-- 无订单 -->
    <van-empty v-else-if="!order" description="当前桌位暂无进行中的订单">
      <van-button class="btn-gradient empty-btn" @click="goMenu">去点餐</van-button>
    </van-empty>

    <!-- 订单详情 -->
    <template v-else>
      <!-- 状态进度条 -->
      <div class="section card steps-card">
        <div class="order-no">订单号 {{ order.orderNo }}</div>
        <van-steps :active="currentStep" active-color="var(--primary)">
          <van-step>待接单</van-step>
          <van-step>已接单</van-step>
          <van-step>制作中</van-step>
          <van-step>已完成</van-step>
        </van-steps>
        <div class="status-tip text-sm text-secondary">
          {{ statusTip }}
        </div>
      </div>

      <!-- 订单明细 -->
      <div class="section card">
        <div class="section-title">订单明细</div>
        <div class="item-list">
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <div class="oi-name">
              {{ item.dishName }}
              <van-tag
                v-if="itemStatusTag(item.status)"
                plain
                size="medium"
                :color="itemStatusColor(item.status)"
                class="item-tag"
              >
                {{ itemStatusTag(item.status) }}
              </van-tag>
            </div>
            <div class="oi-meta">
              <span class="oi-qty">¥{{ fenToYuan(item.priceFen) }} × {{ item.quantity }}</span>
              <span class="oi-sub">¥{{ fenToYuan(item.priceFen * item.quantity) }}</span>
            </div>
            <div v-if="item.remark" class="text-sm text-secondary oi-remark">
              备注：{{ item.remark }}
            </div>
          </div>
        </div>
      </div>

      <!-- 金额与信息 -->
      <div class="section card amount-card">
        <div class="amount-row">
          <span>合计</span>
          <span class="total-amount">¥{{ fenToYuan(order.totalFen) }}</span>
        </div>
        <div class="info-row text-sm text-secondary">
          <span>结账方式：{{ settleLabel }}</span>
          <span>{{ formatTime(order.createdAt) }}</span>
        </div>
      </div>

      <div class="actions">
        <van-button class="btn-gradient action-btn" block @click="goMenu">继续点餐</van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Steps as VanSteps,
  Step as VanStep,
  Button as VanButton,
  Icon as VanIcon,
  Tag as VanTag,
  Empty as VanEmpty,
  Loading as VanLoading,
  showFailToast,
} from 'vant';
import { customerApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';
import { useWebSocket } from '../../composables/useWebSocket';

interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  priceFen: number;
  quantity: number;
  remark: string | null;
  status: string;
}

interface OrderData {
  id: string;
  tenantId: string;
  deskId: string;
  orderNo: string;
  status: string;
  totalFen: number;
  settleType: string | null;
  payMethod: string | null;
  createdAt: string;
  items: OrderItem[];
}

const route = useRoute();
const router = useRouter();
const qrToken = route.params.qrToken as string;

const order = ref<OrderData | null>(null);
const loading = ref(true);

// WebSocket 所需的 tenantId / deskId（从 getOrder 返回数据获取，异步设置）
const wsTenantId = ref('');
const wsDeskId = ref('');
const { connected, messages, connect, disconnect } = useWebSocket(
  wsTenantId,
  wsDeskId,
  'customer',
);

// 状态步进: pending=待接单 paid=已接单 cooking=制作中 served=已完成
const statusSteps = ['pending', 'paid', 'cooking', 'served'];

const currentStep = computed(() => {
  if (!order.value) return 0;
  const idx = statusSteps.indexOf(order.value.status);
  return idx >= 0 ? idx : 0;
});

const statusTip = computed(() => {
  switch (order.value?.status) {
    case 'pending':
      return '订单已提交，等待吧台接单...';
    case 'paid':
      return '已接单，即将开始制作';
    case 'cooking':
      return '后厨正在加紧制作中，请耐心等待';
    case 'served':
      return '订单已完成，祝您用餐愉快！';
    default:
      return '';
  }
});

const settleLabel = computed(() => {
  if (order.value?.settleType === 'self') return '自助支付';
  if (order.value?.settleType === 'bar') return '吧台结账';
  return '待结账';
});

function itemStatusTag(status: string): string {
  switch (status) {
    case 'new':
      return '待制作';
    case 'cooking':
      return '制作中';
    case 'done':
      return '已完成';
    default:
      return '';
  }
}

function itemStatusColor(status: string): string {
  switch (status) {
    case 'new':
      return 'var(--text-secondary)';
    case 'cooking':
      return 'var(--primary)';
    case 'done':
      return 'var(--success)';
    default:
      return 'var(--text-secondary)';
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function goMenu() {
  router.replace(`/c/${qrToken}`);
}

async function fetchOrder() {
  try {
    const res: any = await customerApi.getOrder(qrToken);
    const data = res.data;
    if (!data) {
      order.value = null;
      return;
    }
    order.value = {
      id: data.id,
      tenantId: data.tenantId,
      deskId: data.deskId,
      orderNo: data.orderNo,
      status: data.status,
      totalFen: data.totalFen,
      settleType: data.settleType,
      payMethod: data.payMethod,
      createdAt: data.createdAt,
      items: (data.items || []).map((i: any) => ({
        id: i.id,
        dishId: i.dishId,
        dishName: i.dishName,
        priceFen: i.priceFen,
        quantity: i.quantity,
        remark: i.remark,
        status: i.status,
      })),
    };
    // 设置 WebSocket 连接参数
    wsTenantId.value = order.value.tenantId;
    wsDeskId.value = order.value.deskId;
  } catch (err: any) {
    showFailToast(err?.response?.data?.message || err?.message || '查询订单失败');
  } finally {
    loading.value = false;
  }
}

// WebSocket 实时更新：监听 order:status / payment:done 事件
watch(
  () => messages.value.length,
  () => {
    const latest = messages.value[messages.value.length - 1];
    if (!latest || !order.value) return;
    if (latest.type === 'order:status' && latest.orderId === order.value.id) {
      order.value.status = latest.status;
      // 状态推进时也可同步刷新明细
      fetchOrder();
    } else if (
      latest.type === 'payment:done' &&
      latest.orderId === order.value.id
    ) {
      fetchOrder();
    }
  },
);

// 轮询兜底：每 8 秒刷新一次，防止 WS 偶发断连导致状态停滞
let pollTimer: number | null = null;

onMounted(async () => {
  await fetchOrder();
  // 仅在拿到订单且参数齐全时建立 WS 连接
  if (order.value && wsTenantId.value && wsDeskId.value) {
    connect();
  }
  pollTimer = window.setInterval(fetchOrder, 8000);
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
.status-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 12px 12px 40px;
}
.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 16px;
}
.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
}
.header-title {
  font-size: 17px;
  font-weight: 700;
}
.header-placeholder {
  width: 32px;
}
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}
.empty-btn {
  height: 44px;
  border-radius: 22px;
  padding: 0 32px;
  font-size: 15px;
  font-weight: 600;
}
.section {
  margin-bottom: 12px;
}
.section.card {
  padding: 16px;
}
.steps-card {
  text-align: left;
}
.order-no {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.status-tip {
  margin-top: 12px;
  text-align: center;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}
.item-list .order-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.item-list .order-item:last-child {
  border-bottom: none;
}
.oi-name {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.item-tag {
  flex-shrink: 0;
}
.oi-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.oi-qty {
  font-size: 13px;
  color: var(--text-secondary);
}
.oi-sub {
  font-size: 15px;
  font-weight: 600;
}
.oi-remark {
  margin-top: 4px;
}
.amount-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.total-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions {
  padding: 12px 0;
}
.action-btn {
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
}
</style>
