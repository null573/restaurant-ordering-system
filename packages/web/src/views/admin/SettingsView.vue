<template>
  <div class="page settings-page">
    <div class="page-header">
      <span class="page-title">系统设置</span>
    </div>

    <!-- 餐厅信息 -->
    <div class="section">
      <div class="section-title">餐厅信息</div>
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="餐厅名称"
          placeholder="请输入餐厅名称"
        />
        <van-field
          v-model="form.contactPhone"
          label="联系电话"
          type="tel"
          maxlength="11"
          placeholder="用于小票与客服联系"
        />
      </van-cell-group>
      <div class="section-tip text-sm text-secondary">名称与联系电话将随配置一同保存。</div>
    </div>

    <!-- 微信支付配置 -->
    <div class="section">
      <div class="section-title">微信支付配置</div>
      <van-cell-group inset>
        <van-field
          v-model="form.wechatAppid"
          label="AppID"
          placeholder="微信公众号/小程序 AppID"
          clearable
        />
        <van-field
          v-model="form.wechatMchid"
          label="商户号"
          placeholder="微信支付商户号"
          clearable
        />
      </van-cell-group>
      <div class="section-tip text-sm text-secondary">
        配置后即可开启微信扫码支付与订阅续费。
      </div>
    </div>

    <!-- 订阅套餐 -->
    <div class="section">
      <div class="section-title">订阅套餐</div>
      <van-cell-group inset>
        <van-field
          v-model="form.trialDays"
          label="试用天数"
          type="digit"
          placeholder="如 7"
        />
        <van-field
          v-model="form.planPriceYuan"
          label="付费金额(元)"
          type="number"
          placeholder="如 99.00"
        />
        <van-field
          v-model="form.planCycleDays"
          label="付费周期(天)"
          type="digit"
          placeholder="如 30"
        />
      </van-cell-group>
      <div class="section-tip text-sm text-secondary">仅店主（owner）可修改以上套餐参数。</div>
    </div>

    <div class="save-bar">
      <van-button block round type="primary" :loading="saving" @click="onSave">
        保存设置
      </van-button>
    </div>

    <!-- 网页管理后台提示 -->
    <div class="section">
      <div class="section-title">网页管理后台</div>
      <div class="web-admin card">
        <van-icon name="desktop-o" size="28" color="var(--primary)" />
        <div class="web-admin-body">
          <div class="web-admin-title">在电脑端管理更高效</div>
          <div class="text-sm text-secondary">
            本系统支持在电脑浏览器中访问完整管理后台，建议在 PC 端进行菜品批量导入、订单数据分析等操作。
          </div>
        </div>
      </div>
      <div class="web-admin-actions">
        <van-button plain type="primary" size="small" icon="link-o" @click="onCopyLink">
          复制后台链接
        </van-button>
        <van-button plain type="primary" size="small" icon="apps-o" @click="onOpenAdmin">
          进入管理首页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  CellGroup as VanCellGroup,
  Field as VanField,
  Button as VanButton,
  Icon as VanIcon,
  showToast,
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
} from 'vant';
import { subscriptionApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';

const auth = useAuthStore();
const router = useRouter();

const form = ref({
  name: '',
  contactPhone: '',
  wechatAppid: '',
  wechatMchid: '',
  trialDays: '',
  planPriceYuan: '',
  planCycleDays: '',
});

const saving = ref(false);

async function loadSettings() {
  try {
    const res: any = await subscriptionApi.getSettings();
    const s = res.data || {};
    form.value.wechatAppid = s.wechat_appid || '';
    form.value.wechatMchid = s.wechat_mchid || '';
    form.value.trialDays = s.trial_days != null ? String(s.trial_days) : '';
    form.value.planPriceYuan = fenToYuan(s.plan_price_fen ?? 0);
    form.value.planCycleDays = s.plan_cycle_days != null ? String(s.plan_cycle_days) : '';
    // 联系电话默认取当前登录账号手机号
    if (!form.value.contactPhone && auth.user?.phone) {
      form.value.contactPhone = auth.user.phone;
    }
  } catch (e: any) {
    showFailToast(e.message || '加载设置失败');
  }
}

async function onSave() {
  if (saving.value) return;
  saving.value = true;
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
  try {
    const data: any = {
      name: form.value.name.trim(),
      contactPhone: form.value.contactPhone.trim(),
      wechatAppid: form.value.wechatAppid.trim(),
      wechatMchid: form.value.wechatMchid.trim(),
      trialDays: parseInt(form.value.trialDays || '0', 10),
      planPriceFen: yuanToFen(form.value.planPriceYuan),
      planCycleDays: parseInt(form.value.planCycleDays || '0', 10),
    };
    const res: any = await subscriptionApi.updateSettings(data);
    if (res.code !== 0) {
      closeToast();
      showFailToast(res.message || '保存失败');
      return;
    }
    closeToast();
    showSuccessToast('保存成功');
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function onCopyLink() {
  const url = window.location.origin + '/';
  try {
    await navigator.clipboard.writeText(url);
    showSuccessToast('链接已复制');
  } catch {
    showToast(url);
  }
}

function onOpenAdmin() {
  router.push('/');
}

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-page {
  padding-bottom: 32px;
}
.page-header {
  padding: 16px;
  background: var(--card-bg);
  box-shadow: var(--shadow);
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
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
.section-tip {
  padding: 8px 28px 0;
}
.save-bar {
  padding: 20px 16px 0;
}
.web-admin {
  margin: 0 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.web-admin-body {
  flex: 1;
}
.web-admin-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}
.web-admin-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px 0;
}
</style>
