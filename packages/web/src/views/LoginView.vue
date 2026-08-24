<template>
  <div class="page login-page">
    <!-- 顶部品牌区 -->
    <div class="login-header">
      <div class="logo-circle">餐</div>
      <h1 class="brand-title">餐厅点餐系统</h1>
      <p class="brand-subtitle">扫码点餐 · 吧台管理 · 后厨联动</p>
    </div>

    <!-- 登录表单 -->
    <van-form class="login-form" @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          name="phone"
          label="手机号"
          type="tel"
          placeholder="请输入手机号"
          clearable
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
          ]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          clearable
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>

      <div class="login-actions">
        <van-button
          block
          class="btn-gradient submit-btn"
          native-type="submit"
          :loading="loading"
          loading-text="登录中..."
        >
          登录
        </van-button>
        <div class="register-link">
          还没有账号？
          <router-link to="/register" class="text-primary">去注册</router-link>
        </div>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Form as VanForm,
  Field as VanField,
  CellGroup as VanCellGroup,
  Button as VanButton,
  showSuccessToast,
  showFailToast,
} from 'vant';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const phone = ref('');
const password = ref('');
const loading = ref(false);

async function onSubmit() {
  if (loading.value) return;
  loading.value = true;
  try {
    await auth.login(phone.value, password.value);
    showSuccessToast('登录成功');
    router.push('/bar');
  } catch (err: any) {
    showFailToast(err?.response?.data?.message || err?.message || '登录失败，请重试');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, var(--primary) 0%, var(--primary-light) 38%, var(--bg) 38%);
}
.login-header {
  padding: 56px 24px 40px;
  text-align: center;
  color: #fff;
}
.logo-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 32px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}
.brand-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.brand-subtitle {
  font-size: 13px;
  opacity: 0.92;
}
.login-form {
  margin-top: 12px;
}
.login-actions {
  padding: 24px 16px;
}
.submit-btn {
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
}
.register-link {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: var(--text-secondary);
}
.register-link .text-primary {
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}
</style>
