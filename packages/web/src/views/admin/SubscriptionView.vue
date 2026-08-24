<template>
  <div class="page sub-page">
    <!-- 订阅状态卡片 -->
    <div class="status-card card">
      <div class="flex-between">
        <span class="text-secondary">当前状态</span>
        <van-tag :type="statusTag.type" size="large" round>{{ statusTag.label }}</van-tag>
      </div>
      <div class="status-days">
        <span class="days-num">{{ status?.remainingDays ?? 0 }}</span>
        <span class="days-unit">天</span>
      </div>
      <div class="text-sm text-secondary">{{ remainHint }}</div>
      <div class="status-meta">
        <div class="meta-row">
          <span class="text-secondary">到期时间</span>
          <span>{{ formatDate(status?.paidUntil || status?.trialEndAt) }}</span>
        </div>
        <div class="meta-row">
          <span class="text-secondary">套餐周期</span>
          <span>{{ status?.planCycleDays ?? 0 }} 天</span>
        </div>
        <div class="meta-row">
          <span class="text-secondary">套餐价格</span>
          <span class="text-primary">¥{{ fenToYuan(status?.planPriceFen ?? 0) }}</span>
        </div>
      </div>

      <div class="status-actions">
        <van-button
          block
          round
          type="primary"
          :loading="paying"
          :disabled="!canPay"
          @click="onPay"
        >
          {{ status?.isActive ? '续费' : '立即付费' }}
        </van-button>
        <van-button block round plain @click="loadStatus">刷新状态</van-button>
      </div>
    </div>

    <!-- 设置区域（仅 owner 可见） -->
    <div v-if="isOwner" class="section">
      <div class="section-title">订阅设置（仅 Owner）</div>
      <van-cell-group inset>
        <van-field
          v-model="settingsForm.trialDays"
          label="试用天数"
          type="digit"
          placeholder="如 7"
        />
        <van-field
          v-model="settingsForm.planPriceYuan"
          label="付费金额(元)"
          type="number"
          placeholder="如 99.00"
        />
        <van-field
          v-model="settingsForm.planCycleDays"
          label="付费周期(天)"
          type="digit"
          placeholder="如 30"
        />
        <van-field
          v-model="settingsForm.wechatAppid"
          label="微信AppID"
          placeholder="微信公众号/小程序 AppID"
        />
        <van-field
          v-model="settingsForm.wechatMchid"
          label="微信商户号"
          placeholder="微信支付商户号"
        />
      </van-cell-group>
      <div class="form-actions">
        <van-button block round type="primary" :loading="savingSettings" @click="onSaveSettings">
          保存设置
        </van-button>
      </div>
    </div>

    <!-- 支付记录 -->
    <div class="section">
      <div class="section-title">支付记录</div>
      <van-cell-group inset>
        <div v-for="p in payments" :key="p.id" class="pay-row">
          <div class="pay-left">
            <div class="pay-no">{{ p.out_trade_no }}</div>
            <div class="text-sm text-secondary">{{ formatDate(p.paid_at || p.created_at) }}</div>
          </div>
          <div class="pay-right">
            <div class="pay-amount">¥{{ fenToYuan(p.amount_fen) }}</div>
            <van-tag :type="p.status === 'paid' ? 'success' : 'warning'" size="medium">
              {{ p.status === 'paid' ? '已支付' : '待支付' }}
            </van-tag>
          </div>
        </div>
        <van-empty v-if="payments.length === 0" description="暂无支付记录" image-size="80" />
      </van-cell-group>
    </div>

    <!-- 支付二维码弹窗 -->
    <van-popup
      v-model:show="showQrPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
      :style="{ maxHeight: '85%' }"
    >
      <div class="qr-popup">
        <div class="popup-title">微信扫码支付</div>
        <div class="qr-amount">¥{{ fenToYuan(payResult?.amountFen ?? 0) }}</div>
        <div class="qr-amount-sub text-sm text-secondary">
          {{ payResult?.cycleDays ?? 0 }} 天套餐
        </div>
        <div class="qr-img-wrap">
          <img v-if="payQrDataUrl" :src="payQrDataUrl" class="qr-img" alt="微信支付二维码" />
          <van-loading v-else size="24">生成二维码中...</van-loading>
        </div>
        <div class="text-sm text-secondary qr-tip">请使用微信扫描上方二维码完成支付</div>
        <div class="qr-popup-actions">
          <van-button block round type="primary" :loading="polling" @click="onPayFinished">
            我已完成支付
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import {
  Tag as VanTag,
  Button as VanButton,
  CellGroup as VanCellGroup,
  Field as VanField,
  Popup as VanPopup,
  Empty as VanEmpty,
  Loading as VanLoading,
  showToast,
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
} from 'vant';
import { subscriptionApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';

interface SubStatus {
  status: string;
  trialStartedAt: string | null;
  trialDays: number;
  trialEndAt: string | null;
  planPriceFen: number;
  planCycleDays: number;
  paidUntil: string | null;
  remainingDays: number;
  isTrial: boolean;
  isActive: boolean;
}

interface SubPayment {
  id: string;
  out_trade_no: string;
  amount_fen: number;
  cycle_days: number;
  status: string;
  wechat_trade_no: string | null;
  paid_at: string | null;
  created_at: string;
}

interface PayResult {
  paymentId: string;
  outTradeNo: string;
  amountFen: number;
  cycleDays: number;
  codeUrl: string;
}

const auth = useAuthStore();
const isOwner = computed(() => auth.role === 'owner');

const status = ref<SubStatus | null>(null);
const payments = ref<SubPayment[]>([]);

// 设置表单
const settingsForm = ref({
  trialDays: '',
  planPriceYuan: '',
  planCycleDays: '',
  wechatAppid: '',
  wechatMchid: '',
});
const savingSettings = ref(false);

// 支付
const paying = ref(false);
const showQrPopup = ref(false);
const payResult = ref<PayResult | null>(null);
const payQrDataUrl = ref('');
const polling = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollCount = 0;

const statusTag = computed(() => {
  if (!status.value) return { label: '未知', type: 'default' as const };
  if (status.value.isActive) return { label: '已付费', type: 'success' as const };
  if (status.value.isTrial) return { label: '试用中', type: 'warning' as const };
  return { label: '已过期', type: 'danger' as const };
});

const remainHint = computed(() => {
  if (!status.value) return '';
  if (status.value.isActive) return '剩余服务时长';
  if (status.value.isTrial) return '试用剩余天数';
  return '订阅已过期，请尽快续费';
});

const canPay = computed(() => !!(settings.value?.wechat_appid && settings.value?.wechat_mchid));

const settings = ref<{
  trial_days: number;
  plan_price_fen: number;
  plan_cycle_days: number;
  wechat_appid: string | null;
  wechat_mchid: string | null;
} | null>(null);

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

async function loadStatus() {
  try {
    const res: any = await subscriptionApi.status();
    status.value = res.data;
    // 关闭可能存在的轮询
    stopPolling();
  } catch (e: any) {
    showFailToast(e.message || '获取状态失败');
  }
}

async function loadSettings() {
  if (!isOwner.value) return;
  try {
    const res: any = await subscriptionApi.getSettings();
    const s = res.data;
    settings.value = s;
    settingsForm.value = {
      trialDays: String(s.trial_days ?? ''),
      planPriceYuan: fenToYuan(s.plan_price_fen ?? 0),
      planCycleDays: String(s.plan_cycle_days ?? ''),
      wechatAppid: s.wechat_appid || '',
      wechatMchid: s.wechat_mchid || '',
    };
  } catch (e: any) {
    // 非致命
    console.warn('获取设置失败', e);
  }
}

async function loadPayments() {
  try {
    const res: any = await subscriptionApi.getPayments();
    payments.value = (res.data || []) as SubPayment[];
  } catch (e: any) {
    // 静默
  }
}

async function onPay() {
  if (paying.value) return;
  if (!status.value) return;
  if (!settings.value?.wechat_appid || !settings.value?.wechat_mchid) {
    showFailToast('请先在设置中配置微信支付信息');
    return;
  }
  paying.value = true;
  try {
    const res: any = await subscriptionApi.pay({ cycleDays: status.value.planCycleDays });
    if (res.code !== 0) {
      showFailToast(res.message || '创建支付失败');
      return;
    }
    payResult.value = res.data as PayResult;
    payQrDataUrl.value = await QRCode.toDataURL(res.data.codeUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    showQrPopup.value = true;
    // 开启轮询查询支付状态
    startPolling();
  } catch (e: any) {
    showFailToast(e.message || '创建支付失败');
  } finally {
    paying.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollCount = 0;
  polling.value = true;
  pollTimer = setInterval(async () => {
    pollCount++;
    if (pollCount > 40) {
      // 超过约 2 分钟停止
      stopPolling();
      return;
    }
    try {
      const res: any = await subscriptionApi.status();
      if (res.data?.isActive) {
        stopPolling();
        showQrPopup.value = false;
        status.value = res.data;
        showSuccessToast('支付成功');
        await loadPayments();
      }
    } catch {
      /* 忽略轮询错误 */
    }
  }, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  polling.value = false;
}

async function onPayFinished() {
  await loadStatus();
  if (status.value?.isActive) {
    showQrPopup.value = false;
    showSuccessToast('支付成功');
    await loadPayments();
  } else {
    showToast('暂未检测到支付完成，请稍后重试');
  }
}

async function onSaveSettings() {
  if (savingSettings.value) return;
  savingSettings.value = true;
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
  try {
    const data: any = {
      trialDays: parseInt(settingsForm.value.trialDays || '0', 10),
      planPriceFen: yuanToFen(settingsForm.value.planPriceYuan),
      planCycleDays: parseInt(settingsForm.value.planCycleDays || '0', 10),
      wechatAppid: settingsForm.value.wechatAppid.trim(),
      wechatMchid: settingsForm.value.wechatMchid.trim(),
    };
    const res: any = await subscriptionApi.updateSettings(data);
    if (res.code !== 0) {
      closeToast();
      showFailToast(res.message || '保存失败');
      return;
    }
    closeToast();
    showSuccessToast('保存成功');
    await Promise.all([loadSettings(), loadStatus()]);
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '保存失败');
  } finally {
    savingSettings.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadStatus(), loadSettings(), loadPayments()]);
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.sub-page {
  padding: 12px 0 40px;
}
.status-card {
  margin: 0 12px;
  padding: 16px;
}
.status-days {
  margin: 12px 0 4px;
}
.days-num {
  font-size: 36px;
  font-weight: 800;
  color: var(--primary);
}
.days-unit {
  font-size: 16px;
  color: var(--text);
  margin-left: 4px;
}
.status-meta {
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}
.status-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.section {
  margin-top: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 700;
  padding: 0 28px 8px;
  color: var(--text);
}
.form-actions {
  padding: 16px;
}
.pay-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.pay-row:last-child {
  border-bottom: none;
}
.pay-no {
  font-size: 14px;
  color: var(--text);
  word-break: break-all;
}
.pay-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.pay-amount {
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
}
.qr-popup {
  padding: 16px 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.popup-title {
  font-size: 16px;
  font-weight: 700;
}
.qr-amount {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  margin-top: 8px;
}
.qr-amount-sub {
  margin-top: 2px;
}
.qr-img-wrap {
  width: 280px;
  height: 280px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.qr-img {
  width: 260px;
  height: 260px;
}
.qr-tip {
  margin-bottom: 16px;
}
.qr-popup-actions {
  width: 100%;
  padding: 0 24px;
}
</style>
