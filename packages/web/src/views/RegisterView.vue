<template>
  <div class="page register-page">
    <!-- 顶部品牌区 -->
    <div class="register-header">
      <div class="logo-circle">餐</div>
      <h1 class="brand-title">注册新餐厅</h1>
      <p class="brand-subtitle">快速开通，立即开启扫码点餐</p>
    </div>

    <!-- 注册表单 -->
    <van-form class="register-form" @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="餐厅名称"
          placeholder="请输入餐厅名称"
          clearable
          :rules="[{ required: true, message: '请输入餐厅名称' }]"
        />
        <van-field
          v-model="form.contactPhone"
          name="contactPhone"
          label="联系电话"
          type="tel"
          placeholder="请输入手机号"
          clearable
          :rules="[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
          ]"
        />
        <van-field
          v-model="form.managerName"
          name="managerName"
          label="管理员姓名"
          placeholder="请输入管理员姓名"
          clearable
          :rules="[{ required: true, message: '请输入管理员姓名' }]"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请设置密码（不少于 6 位）"
          clearable
          :rules="[
            { required: true, message: '请设置密码' },
            { validator: (v: string) => v.length >= 6, message: '密码不少于 6 位' },
          ]"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          clearable
          :rules="[
            { required: true, message: '请再次输入密码' },
            { validator: validateConfirm, message: '两次输入的密码不一致' },
          ]"
        />
      </van-cell-group>

      <div class="register-actions">
        <van-button
          block
          class="btn-gradient submit-btn"
          native-type="submit"
          :loading="loading"
          loading-text="注册中..."
        >
          注册并开通
        </van-button>
        <div class="login-link">
          已有账号？
          <router-link to="/login" class="text-primary">去登录</router-link>
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

const form = ref({
  name: '',
  contactPhone: '',
  managerName: '',
  password: '',
  confirmPassword: '',
});
const loading = ref(false);

function validateConfirm(val: string) {
  return val === form.value.password;
}

async function onSubmit() {
  if (loading.value) return;
  loading.value = true;
  try {
    await auth.register({
      name: form.value.name.trim(),
      contactPhone: form.value.contactPhone.trim(),
      managerName: form.value.managerName.trim(),
      password: form.value.password,
    });
    showSuccessToast('注册成功');
    router.push('/bar');
  } catch (err: any) {
    showFailToast(err?.response?.data?.message || err?.message || '注册失败，请重试');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, var(--primary) 0%, var(--primary-light) 32%, var(--bg) 32%);
}
.register-header {
  padding: 48px 24px 28px;
  text-align: center;
  color: #fff;
}
.logo-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 30px;
  font-weight: 700;
}
.brand-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}
.brand-subtitle {
  font-size: 13px;
  opacity: 0.92;
}
.register-form {
  margin-top: 8px;
}
.register-actions {
  padding: 24px 16px;
}
.submit-btn {
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
}
.login-link {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: var(--text-secondary);
}
.login-link .text-primary {
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}
</style>
