<template>
  <div class="page user-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <span class="page-title">店员管理</span>
      <button class="btn-gradient btn-sm" @click="openAddUser">+ 新增店员</button>
    </div>

    <!-- 店员列表 -->
    <div class="user-list">
      <van-pull-refresh v-model="refreshing" @refresh="loadUsers">
        <van-cell-group inset v-if="users.length">
          <div v-for="u in users" :key="u.id" class="user-row">
            <div class="user-avatar">
              <van-icon name="manager-o" size="22" color="var(--primary)" />
            </div>
            <div class="user-info">
              <div class="flex-between">
                <span class="user-name">{{ u.name || '未设置姓名' }}</span>
                <van-tag :type="roleTagType(u.role)" size="medium" round>
                  {{ roleText(u.role) }}
                </van-tag>
              </div>
              <div class="text-sm text-secondary user-phone">{{ u.phone }}</div>
            </div>
            <div v-if="isOwner && u.role !== 'owner'" class="user-del">
              <van-icon name="delete-o" size="20" color="var(--danger)" @click="onDeleteUser(u)" />
            </div>
            <van-tag v-else-if="u.role === 'owner'" plain type="primary" size="medium">本人</van-tag>
          </div>
        </van-cell-group>

        <div v-else-if="!loading" class="empty-wrap">
          <van-empty description="暂无店员" />
        </div>
      </van-pull-refresh>
    </div>

    <div v-if="!isOwner" class="hint-bar text-sm text-secondary">
      仅店主（owner）可新增/删除店员
    </div>

    <!-- 新增店员弹窗 -->
    <van-popup
      v-model:show="showUserPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
    >
      <div class="popup-inner">
        <div class="popup-title">新增店员</div>
        <van-form @submit="onSubmitUser">
          <van-cell-group inset>
            <van-field
              v-model="userForm.name"
              label="姓名"
              placeholder="请输入店员姓名"
              :rules="[{ required: true, message: '请输入姓名' }]"
            />
            <van-field
              v-model="userForm.phone"
              label="手机号"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号（登录账号）"
              :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]"
            />
            <van-field
              v-model="userForm.password"
              label="密码"
              type="password"
              placeholder="请设置登录密码"
              :rules="[{ required: true, message: '请设置密码' }, { pattern: /^.{6,}$/, message: '密码至少 6 位' }]"
            />
            <van-field label="角色" is-link readonly :model-value="roleLabel" @click="showRolePicker = true" />
          </van-cell-group>

          <div class="form-actions">
            <van-button block round type="primary" native-type="submit" :loading="submitting">
              确认新增
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 角色选择 -->
    <van-popup v-model:show="showRolePicker" position="bottom" round>
      <van-picker
        :columns="roleColumns"
        @confirm="onPickRole"
        @cancel="showRolePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  PullRefresh as VanPullRefresh,
  CellGroup as VanCellGroup,
  Icon as VanIcon,
  Tag as VanTag,
  Popup as VanPopup,
  Field as VanField,
  Button as VanButton,
  Picker as VanPicker,
  Empty as VanEmpty,
  showToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  showLoadingToast,
  closeToast,
} from 'vant';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores/auth';

interface UserRow {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  created_at: string;
}

const auth = useAuthStore();
const isOwner = computed(() => auth.role === 'owner');

const users = ref<UserRow[]>([]);
const loading = ref(false);
const refreshing = ref(false);

const showUserPopup = ref(false);
const submitting = ref(false);
const showRolePicker = ref(false);

const userForm = ref({
  name: '',
  phone: '',
  password: '',
  role: 'bar',
});

const roleColumns = [
  { text: '经理 (manager)', value: 'manager' },
  { text: '前台 (bar)', value: 'bar' },
  { text: '后厨 (kitchen)', value: 'kitchen' },
];

const roleLabel = computed(() => {
  const r = roleColumns.find((c) => c.value === userForm.value.role);
  return r ? r.text : '请选择角色';
});

function roleText(role: string): string {
  switch (role) {
    case 'owner': return '店主';
    case 'manager': return '经理';
    case 'bar': return '前台';
    case 'kitchen': return '后厨';
    default: return role;
  }
}

function roleTagType(role: string): 'primary' | 'success' | 'warning' | 'danger' {
  switch (role) {
    case 'owner': return 'primary';
    case 'manager': return 'warning';
    case 'bar': return 'success';
    case 'kitchen': return 'danger';
    default: return 'primary';
  }
}

async function loadUsers() {
  loading.value = true;
  try {
    const res: any = await authApi.getUsers();
    users.value = (res.data || []) as UserRow[];
  } catch (e: any) {
    showFailToast(e.message || '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function openAddUser() {
  if (!isOwner.value) {
    showToast('仅店主可新增店员');
    return;
  }
  userForm.value = { name: '', phone: '', password: '', role: 'bar' };
  showUserPopup.value = true;
}

function onPickRole({ selectedValues }: { selectedValues: (string | number)[] }) {
  userForm.value.role = selectedValues[0] != null ? String(selectedValues[0]) : 'bar';
  showRolePicker.value = false;
}

async function onSubmitUser() {
  if (submitting.value) return;
  submitting.value = true;
  showLoadingToast({ message: '创建中...', forbidClick: true, duration: 0 });
  try {
    const res: any = await authApi.addUser({
      phone: userForm.value.phone.trim(),
      password: userForm.value.password,
      name: userForm.value.name.trim(),
      role: userForm.value.role,
    });
    if (res.code !== 0) {
      closeToast();
      showFailToast(res.message || '新增失败');
      return;
    }
    closeToast();
    showSuccessToast('新增成功');
    showUserPopup.value = false;
    await loadUsers();
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '新增失败');
  } finally {
    submitting.value = false;
  }
}

async function onDeleteUser(u: UserRow) {
  try {
    await showConfirmDialog({
      title: '删除店员',
      message: `确定删除店员「${u.name || u.phone}」吗？`,
    });
  } catch {
    return;
  }
  try {
    const res: any = await authApi.deleteUser(u.id);
    if (res.code === 0) {
      showSuccessToast('删除成功');
      await loadUsers();
    } else {
      showFailToast(res.message || '删除失败');
    }
  } catch (e: any) {
    showFailToast(e.message || '删除失败');
  }
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-page {
  padding-bottom: 60px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--card-bg);
  box-shadow: var(--shadow);
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}
.btn-sm {
  padding: 6px 14px !important;
  font-size: 13px !important;
}
.user-list {
  padding: 12px 0;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.user-row:last-child {
  border-bottom: none;
}
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 107, 53, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.user-phone {
  margin-top: 2px;
}
.user-del {
  flex-shrink: 0;
  padding: 6px;
}
.empty-wrap {
  padding: 40px 0;
}
.hint-bar {
  text-align: center;
  padding: 12px;
}
.popup-inner {
  padding: 16px 0 24px;
}
.popup-title {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  padding: 4px 0 16px;
}
.form-actions {
  padding: 16px;
}
</style>
