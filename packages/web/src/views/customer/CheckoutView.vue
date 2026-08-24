<template>
  <div class="page checkout-page">
    <!-- 顶部导航 -->
    <div class="checkout-header">
      <span class="back-btn" @click="router.back()">
        <van-icon name="arrow-left" size="18" />
      </span>
      <span class="header-title">确认订单</span>
      <span class="header-placeholder"></span>
    </div>

    <!-- 订单明细 -->
    <div class="section card">
      <div class="section-title">订单明细</div>
      <van-empty v-if="cart.length === 0" description="购物车为空" image-size="80" />
      <div v-else class="order-list">
        <div v-for="item in cart" :key="item.dishId" class="order-item">
          <div class="oi-name">{{ item.name }}</div>
          <div class="oi-meta">
            <span class="oi-qty">¥{{ fenToYuan(item.priceFen) }} × {{ item.quantity }}</span>
            <span class="oi-sub">¥{{ fenToYuan(item.priceFen * item.quantity) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 备注 -->
    <div class="section card">
      <van-field
        v-model="remark"
        label="订单备注"
        type="textarea"
        placeholder="如有忌口、口味等特殊要求请填写"
        rows="1"
        autosize
        maxlength="100"
        show-word-limit
      />
    </div>

    <!-- 合计 -->
    <div class="total-bar card">
      <span>合计</span>
      <span class="total-amount">¥{{ fenToYuan(totalFen) }}</span>
    </div>

    <!-- 结账方式 -->
    <div class="section">
      <div class="section-title">选择结账方式</div>
      <div class="pay-options">
        <div
          class="pay-card card"
          :class="{ active: payMethod === 'wechat' }"
          @click="payMethod = 'wechat'"
        >
          <div class="pay-icon wechat-icon">
            <van-icon name="chat-o" size="22" />
          </div>
          <div class="pay-text">
            <div class="pay-name">扫码微信支付(自助)</div>
            <div class="pay-desc text-sm text-secondary">微信扫码，自助完成支付</div>
          </div>
          <van-icon
            :name="payMethod === 'wechat' ? 'success' : 'circle'"
            :color="payMethod === 'wechat' ? 'var(--primary)' : '#c8c9cc'"
            size="20"
          />
        </div>

        <div
          class="pay-card card"
          :class="{ active: payMethod === 'bar' }"
          @click="payMethod = 'bar'"
        >
          <div class="pay-icon bar-icon">
            <van-icon name="balance-o" size="22" />
          </div>
          <div class="pay-text">
            <div class="pay-name">到吧台结账</div>
            <div class="pay-desc text-sm text-secondary">提交后请到吧台由店员处理</div>
          </div>
          <van-icon
            :name="payMethod === 'bar' ? 'success' : 'circle'"
            :color="payMethod === 'bar' ? 'var(--primary)' : '#c8c9cc'"
            size="20"
          />
        </div>
      </div>

      <van-button
        block
        class="btn-gradient submit-btn"
        :loading="submitting"
        :disabled="cart.length === 0 || !payMethod"
        @click="onSubmit"
      >
        {{ submitText }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Field as VanField,
  Button as VanButton,
  Icon as VanIcon,
  Empty as VanEmpty,
  showFailToast,
  showLoadingToast,
  closeToast,
  showDialog,
} from 'vant';
import { customerApi, paymentApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';

interface CartItem {
  dishId: string;
  name: string;
  priceFen: number;
  quantity: number;
}

const route = useRoute();
const router = useRouter();
const qrToken = route.params.qrToken as string;
const cartStorageKey = `cart_${qrToken}`;

const cart = ref<CartItem[]>([]);
const remark = ref('');
const payMethod = ref<'wechat' | 'bar' | null>(null);
const submitting = ref(false);

const totalFen = computed(() =>
  cart.value.reduce((sum, i) => sum + i.priceFen * i.quantity, 0),
);

const submitText = computed(() => {
  if (!payMethod.value) return '请选择结账方式';
  if (payMethod.value === 'wechat') return '确认并支付';
  return '提交订单';
});

function buildItems() {
  return cart.value.map((c) => ({
    dishId: c.dishId,
    name: c.name,
    priceFen: c.priceFen,
    quantity: c.quantity,
    remark: '',
  }));
}

async function payWechat() {
  if (cart.value.length === 0) return;
  submitting.value = true;
  showLoadingToast({ message: '提交订单中...', forbidClick: true, duration: 0 });
  try {
    const res: any = await customerApi.submitOrder(qrToken, {
      items: buildItems(),
      remark: remark.value,
    });
    const orderId = res.data?.orderId;
    if (!orderId) {
      closeToast();
      showFailToast('创建订单失败');
      return;
    }
    // 调用 H5 支付，获取微信支付跳转链接
    const payRes: any = await paymentApi.h5({ orderId });
    closeToast();
    const h5Url = payRes.data?.h5Url;
    if (h5Url) {
      sessionStorage.removeItem(cartStorageKey);
      window.location.href = h5Url;
    } else {
      showFailToast('未获取到支付链接');
    }
  } catch (err: any) {
    closeToast();
    showFailToast(err?.response?.data?.message || err?.message || '提交订单失败');
  } finally {
    submitting.value = false;
  }
}

async function payBar() {
  if (cart.value.length === 0) return;
  submitting.value = true;
  showLoadingToast({ message: '提交订单中...', forbidClick: true, duration: 0 });
  try {
    await customerApi.submitOrder(qrToken, {
      items: buildItems(),
      remark: remark.value,
    });
    closeToast();
    sessionStorage.removeItem(cartStorageKey);
    await showDialog({
      title: '下单成功',
      message: '请到吧台结账',
      confirmButtonText: '我知道了',
      confirmButtonColor: 'var(--primary)',
    });
    router.replace(`/c/${qrToken}`);
  } catch (err: any) {
    closeToast();
    showFailToast(err?.response?.data?.message || err?.message || '提交订单失败');
  } finally {
    submitting.value = false;
  }
}

function onSubmit() {
  if (cart.value.length === 0) {
    showFailToast('购物车为空');
    return;
  }
  if (!payMethod.value) {
    showFailToast('请选择结账方式');
    return;
  }
  if (payMethod.value === 'wechat') payWechat();
  else payBar();
}

onMounted(() => {
  const saved = sessionStorage.getItem(cartStorageKey);
  if (saved) {
    try {
      cart.value = JSON.parse(saved);
    } catch {
      cart.value = [];
    }
  }
  if (cart.value.length === 0) {
    showFailToast('购物车为空');
    setTimeout(() => router.replace(`/c/${qrToken}`), 1200);
  }
});
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 12px 12px 40px;
}
.checkout-header {
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
.section {
  margin-bottom: 12px;
}
.section .card,
.section.card {
  padding: 12px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}
.order-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.order-item:last-child {
  border-bottom: none;
}
.oi-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
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
  color: var(--text);
}
.total-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}
.pay-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.pay-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  transition: border-color 0.2s;
}
.pay-card.active {
  border-color: var(--primary);
}
.pay-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wechat-icon {
  background: rgba(7, 193, 96, 0.12);
  color: var(--success);
}
.bar-icon {
  background: rgba(255, 107, 53, 0.12);
  color: var(--primary);
}
.pay-text {
  flex: 1;
}
.pay-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.submit-btn {
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
}
</style>
