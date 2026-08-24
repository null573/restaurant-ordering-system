<template>
  <div class="settlement page">
    <van-nav-bar title="结算" left-arrow fixed placeholder @click-left="router.back()" />

    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <van-loading>加载中...</van-loading>
    </div>

    <!-- 无活跃订单 -->
    <div v-else-if="!order" class="empty-box">
      <van-empty description="该桌暂无待结算订单" />
      <van-button plain block class="back-btn" @click="router.push('/bar')">返回吧台</van-button>
    </div>

    <!-- 结算主体 -->
    <div v-else class="settle-body">
      <!-- 订单概览 -->
      <div class="info-card card">
        <div class="info-row">
          <span class="label">桌号</span>
          <span class="value">{{ detail?.desk_number || order.desk_number }}</span>
        </div>
        <div class="info-row">
          <span class="label">订单号</span>
          <span class="value">{{ detail?.order_no || order.order_no }}</span>
        </div>
        <div class="info-row">
          <span class="label">状态</span>
          <van-tag :type="statusTagType(detail?.status || order.status)">
            {{ statusText(detail?.status || order.status) }}
          </van-tag>
        </div>
      </div>

      <!-- 订单明细 -->
      <van-cell-group title="订单明细" inset>
        <van-cell v-for="item in (detail?.items || [])" :key="item.id">
          <template #title>
            <div class="item-row">
              <span class="item-name">{{ item.dish_name }}</span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
            <div v-if="item.remark" class="item-remark">备注：{{ item.remark }}</div>
          </template>
          <template #value>
            <div class="item-price">
              <div class="price-unit">¥{{ fenToYuan(item.price_fen) }}</div>
              <div class="price-sub">¥{{ fenToYuan(item.price_fen * item.quantity) }}</div>
            </div>
          </template>
        </van-cell>
        <van-cell v-if="!(detail?.items?.length)" title="暂无明细" />
      </van-cell-group>

      <!-- 合计金额（大号红色） -->
      <div class="total-card card">
        <span class="total-label">合计</span>
        <span class="total-amount">¥{{ totalYuan }}</span>
      </div>

      <!-- 现金结账 -->
      <div class="section-title">现金结账</div>
      <div class="cash-box card">
        <van-field
          v-model="paidInput"
          type="number"
          label="实付金额"
          placeholder="请输入实付金额"
          input-align="right"
        >
          <template #button>元</template>
        </van-field>
        <div class="change-row">
          <span class="label">找零</span>
          <span class="change-amount" :class="{ disabled: changeFen <= 0 }">
            ¥{{ changeYuan }}
          </span>
        </div>
        <van-button
          type="primary"
          block
          class="cash-btn"
          :disabled="submitting || paidFen < totalFen"
          :loading="submitting"
          @click="onCashSettle"
        >
          确认现金结账
        </van-button>
      </div>

      <!-- 微信结账 -->
      <div class="section-title">微信结账</div>
      <div class="wechat-box card">
        <div v-if="wechatPaid" class="wechat-status success">已通过微信支付</div>
        <div v-else class="wechat-status waiting">等待顾客自助微信支付</div>
      </div>

      <!-- 打印 -->
      <div class="action-bar">
        <van-button plain block @click="onPrint">打印结算单</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../../api';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';
import {
  NavBar as VanNavBar,
  Cell as VanCell,
  CellGroup as VanCellGroup,
  Field as VanField,
  Button as VanButton,
  Tag as VanTag,
  Loading as VanLoading,
  Empty as VanEmpty,
  showSuccessToast,
  showToast,
} from 'vant';

const route = useRoute();
const router = useRouter();

// 路由参数 :orderId 实际为 deskId（从桌位状态页跳转时传入）
const deskId = String(route.params.orderId || '');

const order = ref<any>(null); // 活跃订单（列表项）
const detail = ref<any>(null); // 订单详情（含 items）
const loading = ref(true);
const submitting = ref(false);

const paidInput = ref<string | number>(''); // 实付金额（元）

const totalFen = computed(() =>
  Number(detail.value?.total_fen ?? order.value?.total_fen ?? 0)
);
const paidFen = computed(() => (paidInput.value === '' ? 0 : yuanToFen(paidInput.value)));
const changeFen = computed(() => Math.max(0, paidFen.value - totalFen.value));
const totalYuan = computed(() => fenToYuan(totalFen.value));
const changeYuan = computed(() => fenToYuan(changeFen.value));

// 微信是否已支付（order.status === 'paid' && pay_method === 'wechat'）
const wechatPaid = computed(() => {
  const o = detail.value || order.value;
  return !!o && o.pay_method === 'wechat' && o.status === 'paid';
});

// 查找该桌的活跃订单
async function loadOrder() {
  loading.value = true;
  try {
    // 优先查待支付订单
    let res: any = await orderApi.list({ deskId, status: 'pending' });
    let list: any[] = res.data || [];
    if (!list.length) {
      // 无待支付订单，回退查找该桌任意未结订单（如已微信支付待打印）
      res = await orderApi.list({ deskId });
      list = (res.data || []).filter((o: any) =>
        ['pending', 'paid', 'cooking', 'served'].includes(o.status)
      );
    }
    const active = list[0];
    if (!active) {
      order.value = null;
      detail.value = null;
      return;
    }
    order.value = active;
    const d: any = await orderApi.detail(active.id);
    detail.value = d.data;
  } catch {
    showToast('订单加载失败');
  } finally {
    loading.value = false;
  }
}

// 现金结账
async function onCashSettle() {
  if (!order.value) return;
  if (paidFen.value < totalFen.value) {
    showToast('实付金额不足');
    return;
  }
  try {
    submitting.value = true;
    const res: any = await orderApi.barCash({
      orderId: order.value.id,
      paidFen: paidFen.value,
    });
    showSuccessToast(res.message || '现金结账成功');
    setTimeout(() => router.push('/bar'), 800);
  } catch (e: any) {
    showToast(e?.response?.data?.message || '结账失败');
  } finally {
    submitting.value = false;
  }
}

// 打印结算单：先获取结算单数据，再 window.print 打印
async function onPrint() {
  if (!order.value) return;
  try {
    const res: any = await orderApi.receipt(order.value.id);
    const receipt = res.data;
    if (!receipt) {
      showToast('无结算单数据');
      return;
    }
    printReceipt(receipt);
  } catch {
    showToast('获取结算单失败');
  }
}

function printReceipt(r: any) {
  const html = buildReceiptHtml(r);
  const win = window.open('', '_blank', 'width=380,height=640');
  if (!win) {
    showToast('请允许弹出窗口以打印');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function buildReceiptHtml(r: any): string {
  const items = (r.items || [])
    .map(
      (it: any) => `
      <tr>
        <td class="l">${escapeHtml(it.name)}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">¥${fenToYuan(it.priceFen)}</td>
        <td class="r">¥${fenToYuan(it.subtotalFen)}</td>
      </tr>`
    )
    .join('');
  const payText =
    r.payMethod === 'cash' ? '现金' : r.payMethod === 'wechat' ? '微信' : '—';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>结算单</title>
<style>
  body { font-family: 'PingFang SC', sans-serif; padding: 12px; font-size: 12px; color: #323233; }
  h2 { text-align: center; margin: 4px 0; }
  .sub { text-align: center; color: #969799; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4px 2px; border-bottom: 1px dashed #ebedf0; text-align: left; }
  th { color: #969799; font-weight: 500; }
  .c { text-align: center; }
  .r { text-align: right; }
  .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 8px; color: #ee0a24; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
</style></head>
<body>
  <h2>结算单</h2>
  <div class="sub">单号 ${escapeHtml(r.orderNo || '')} · 桌号 ${escapeHtml(r.deskNumber || '')}</div>
  <table>
    <thead><tr><th>菜品</th><th class="c">数量</th><th class="r">单价</th><th class="r">小计</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total"><span>合计</span><span>¥${fenToYuan(r.totalFen)}</span></div>
  <div class="row"><span>支付方式</span><span>${payText}</span></div>
  <div class="row"><span>实付</span><span>¥${fenToYuan(r.paidFen)}</span></div>
  <div class="row"><span>找零</span><span>¥${fenToYuan(r.changeFen)}</span></div>
  <div class="sub" style="margin-top:12px;">谢谢惠顾</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'
  );
}

function statusText(s: string): string {
  const m: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cooking: '制作中',
    served: '已上菜',
    closed: '已结账',
    cancelled: '已取消',
  };
  return m[s] || s;
}
function statusTagType(s: string): 'primary' | 'success' | 'warning' | 'default' {
  if (s === 'paid') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'closed' || s === 'cancelled') return 'default';
  return 'primary';
}

onMounted(loadOrder);
</script>

<style scoped>
.settlement {
  padding-bottom: 24px;
}
.loading-box,
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  gap: 16px;
}
.back-btn {
  width: 60%;
}
.settle-body {
  padding: 12px;
}
.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.info-card {
  padding: 12px 16px;
  margin-bottom: 12px;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}
.info-row .label {
  color: var(--text-secondary);
}
.info-row .value {
  font-weight: 500;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-name {
  font-weight: 500;
}
.item-qty {
  color: var(--text-secondary);
  font-size: 12px;
}
.item-remark {
  color: var(--danger);
  font-size: 12px;
  margin-top: 2px;
}
.item-price {
  text-align: right;
}
.price-unit {
  color: var(--text-secondary);
  font-size: 12px;
}
.price-sub {
  font-weight: 600;
}
.total-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin: 12px 0;
}
.total-label {
  font-size: 16px;
  font-weight: 600;
}
.total-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--danger);
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 16px 4px 8px;
}
.cash-box {
  padding: 4px 4px 12px;
}
.change-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 4px;
}
.change-row .label {
  color: var(--text-secondary);
}
.change-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--success);
}
.change-amount.disabled {
  color: var(--text-secondary);
}
.cash-btn {
  margin: 8px 12px 0;
  width: calc(100% - 24px);
}
.wechat-box {
  padding: 16px;
  text-align: center;
}
.wechat-status {
  font-size: 15px;
  font-weight: 600;
  padding: 8px 0;
}
.wechat-status.success {
  color: var(--success);
}
.wechat-status.waiting {
  color: var(--warning);
}
.action-bar {
  margin-top: 16px;
  padding: 0 12px;
}
</style>
