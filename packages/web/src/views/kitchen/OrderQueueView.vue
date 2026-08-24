<template>
  <div class="kitchen page">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-box">
        <van-loading>加载中...</van-loading>
      </div>

      <template v-else>
        <!-- 待接单 -->
        <div class="section">
          <div class="section-head">
            <span class="dot dot-pending"></span>
            <span class="title">待接单</span>
            <van-tag round type="warning">{{ pending.length }}</van-tag>
          </div>

          <div v-if="pending.length" class="order-list">
            <div v-for="o in pending" :key="o.id" class="order-card card">
              <div class="order-head">
                <span class="desk">{{ o.desk_number }}</span>
                <span class="orderno">{{ o.order_no }}</span>
                <span class="amount">¥{{ fenToYuan(o.total_fen) }}</span>
              </div>
              <div class="dish-list">
                <div v-for="item in (o.items || [])" :key="item.id" class="dish-row">
                  <div class="dish-main">
                    <span class="dish-name">{{ item.dish_name }} x{{ item.quantity }}</span>
                    <span v-if="item.remark" class="dish-remark">{{ item.remark }}</span>
                  </div>
                  <span class="tag-btn" @click="cycleItem(o, item)">
                    <van-tag :type="itemTagType(item.status)" size="medium">
                      {{ itemText(item.status) }}
                    </van-tag>
                  </span>
                </div>
                <div v-if="!(o.items || []).length" class="empty-items">暂无菜品</div>
              </div>
              <div class="order-actions">
                <van-button type="primary" size="small" @click="acceptOrder(o)">接单</van-button>
              </div>
            </div>
          </div>
          <van-empty v-else description="暂无待接单订单" image-size="80" />
        </div>

        <!-- 制作中 -->
        <div class="section">
          <div class="section-head">
            <span class="dot dot-cooking"></span>
            <span class="title">制作中</span>
            <van-tag round type="primary">{{ cooking.length }}</van-tag>
          </div>

          <div v-if="cooking.length" class="order-list">
            <div v-for="o in cooking" :key="o.id" class="order-card card">
              <div class="order-head">
                <span class="desk">{{ o.desk_number }}</span>
                <span class="orderno">{{ o.order_no }}</span>
                <span class="amount">¥{{ fenToYuan(o.total_fen) }}</span>
              </div>
              <div class="dish-list">
                <div v-for="item in (o.items || [])" :key="item.id" class="dish-row">
                  <div class="dish-main">
                    <span class="dish-name">{{ item.dish_name }} x{{ item.quantity }}</span>
                    <span v-if="item.remark" class="dish-remark">{{ item.remark }}</span>
                  </div>
                  <span class="tag-btn" @click="cycleItem(o, item)">
                    <van-tag :type="itemTagType(item.status)" size="medium">
                      {{ itemText(item.status) }}
                    </van-tag>
                  </span>
                </div>
                <div v-if="!(o.items || []).length" class="empty-items">暂无菜品</div>
              </div>
              <div class="order-actions">
                <span class="ready-tip" v-if="!allDone(o)">尚有未完成菜品</span>
                <van-button
                  type="success"
                  size="small"
                  :disabled="!allDone(o)"
                  @click="serveOrder(o)"
                >
                  出餐
                </van-button>
              </div>
            </div>
          </div>
          <van-empty v-else description="暂无制作中订单" image-size="80" />
        </div>
      </template>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { orderApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';
import {
  PullRefresh as VanPullRefresh,
  Empty as VanEmpty,
  Button as VanButton,
  Tag as VanTag,
  Loading as VanLoading,
  showToast,
} from 'vant';

// pending / cooking 列表均附带 items（来自订单详情）
const pending = ref<any[]>([]);
const cooking = ref<any[]>([]);
const loading = ref(true);
const refreshing = ref(false);

// 全部菜品已完成
function allDone(order: any): boolean {
  const items = order.items || [];
  return items.length > 0 && items.every((i: any) => i.status === 'done');
}

// 拉取订单（列表 + 各订单详情）
async function fetchOrders(silent = false) {
  if (!silent) loading.value = true;
  try {
    const [pendRes, cookRes]: any[] = await Promise.all([
      orderApi.list({ status: 'pending' }),
      orderApi.list({ status: 'cooking' }),
    ]);
    const pendList: any[] = pendRes.data || [];
    const cookList: any[] = cookRes.data || [];

    const withDetails = (list: any[]) =>
      Promise.all(
        list.map((o: any) =>
          orderApi
            .detail(o.id)
            .then((r: any) => ({ ...o, ...(r.data || {}) }))
            .catch(() => ({ ...o, items: [] }))
        )
      );

    const [pendDetails, cookDetails] = await Promise.all([
      withDetails(pendList),
      withDetails(cookList),
    ]);
    pending.value = pendDetails;
    cooking.value = cookDetails;
  } catch {
    // 忽略错误，保留上次数据
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

// 单个菜品状态流转：new -> cooking -> done
async function cycleItem(order: any, item: any) {
  if (item.status === 'done') return;
  const next = item.status === 'new' ? 'cooking' : 'done';
  try {
    await orderApi.updateItemStatus(order.id, item.id, next);
    item.status = next; // 乐观更新
    showToast(next === 'done' ? '已标记完成' : '已标记制作中');
  } catch {
    showToast('更新失败');
    fetchOrders(true);
  }
}

// 接单：pending -> cooking
async function acceptOrder(order: any) {
  try {
    await orderApi.updateStatus(order.id, 'cooking');
    showToast('已接单');
    fetchOrders(true);
  } catch {
    showToast('操作失败');
  }
}

// 出餐：cooking -> served（需全部菜品完成）
async function serveOrder(order: any) {
  if (!allDone(order)) {
    showToast('尚有未完成菜品');
    return;
  }
  try {
    await orderApi.updateStatus(order.id, 'served');
    showToast('已出餐');
    fetchOrders(true);
  } catch {
    showToast('操作失败');
  }
}

function onRefresh() {
  refreshing.value = true;
  fetchOrders(true);
}

function itemTagType(s: string): 'primary' | 'success' | 'warning' {
  if (s === 'done') return 'success';
  if (s === 'cooking') return 'warning';
  return 'primary';
}
function itemText(s: string): string {
  if (s === 'done') return '已完成';
  if (s === 'cooking') return '制作中';
  return '待制作';
}

// 每 5 秒轮询刷新
let pollTimer: number | null = null;
onMounted(() => {
  fetchOrders();
  pollTimer = window.setInterval(() => fetchOrders(true), 5000);
});
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style scoped>
.kitchen {
  padding: 12px;
  padding-bottom: 24px;
}
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
}
.section {
  margin-bottom: 16px;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 10px;
}
.section-head .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot-pending {
  background: var(--warning);
}
.dot-cooking {
  background: var(--primary);
}
.section-head .title {
  font-size: 15px;
  font-weight: 600;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.order-card {
  padding: 12px 14px;
}
.order-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.order-head .desk {
  font-weight: 700;
  font-size: 16px;
  color: var(--primary);
}
.order-head .orderno {
  font-size: 12px;
  color: var(--text-secondary);
}
.order-head .amount {
  margin-left: auto;
  font-weight: 600;
}
.dish-list {
  padding: 8px 0;
}
.dish-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}
.dish-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dish-name {
  font-size: 14px;
}
.dish-remark {
  font-size: 12px;
  color: var(--danger);
}
.tag-btn {
  cursor: pointer;
  padding: 2px 4px;
}
.empty-items {
  color: var(--text-secondary);
  font-size: 12px;
  padding: 4px 0;
}
.order-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.ready-tip {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
