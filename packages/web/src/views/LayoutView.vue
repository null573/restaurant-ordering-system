<template>
  <div class="layout">
    <!-- 顶部导航栏：显示餐厅名（从 localStorage userInfo 读取） -->
    <van-nav-bar class="layout-nav" :title="restaurantName" fixed placeholder />

    <!-- 子路由出口 -->
    <main class="layout-main">
      <router-view />
    </main>

    <!-- 底部 Tab 导航 -->
    <van-tabbar :model-value="active" placeholder safe-area-inset-bottom @change="onTabChange">
      <van-tabbar-item icon="shop-o">吧台</van-tabbar-item>
      <van-tabbar-item icon="fire-o">厨房</van-tabbar-item>
      <van-tabbar-item v-if="showManage" icon="apps-o">管理</van-tabbar-item>
    </van-tabbar>

    <!-- 管理下拉菜单 -->
    <van-action-sheet
      v-model:show="showSheet"
      title="管理菜单"
      :actions="sheetActions"
      close-on-click-action
      cancel-text="取消"
      @select="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NavBar as VanNavBar,
  Tabbar as VanTabbar,
  TabbarItem as VanTabbarItem,
  ActionSheet as VanActionSheet,
} from 'vant';

const route = useRoute();
const router = useRouter();

// 从 localStorage 读取 userInfo（餐厅名 + 角色）
function readUserInfo(): { name?: string; role?: string } {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
}
const userInfo = readUserInfo();
const restaurantName = userInfo.name || '我的餐厅';
const role = userInfo.role || '';

// 角色可见性：
// - owner  可见全部（吧台 / 厨房 / 管理，管理含全部 6 项）
// - manager 隐藏"设置"（管理菜单含 5 项）
// - bar / kitchen 只可见吧台和厨房（无管理入口）
const showManage = role === 'owner' || role === 'manager';

interface AdminItem {
  name: string;
  path: string;
}
const adminItems = computed<AdminItem[]>(() => {
  const items: AdminItem[] = [
    { name: '菜品管理', path: '/admin/dishes' },
    { name: '桌位管理', path: '/admin/desks' },
    { name: '二维码', path: '/admin/qrcodes' },
    { name: '订阅', path: '/admin/subscription' },
    { name: '店员', path: '/admin/users' },
  ];
  if (role === 'owner') {
    items.push({ name: '设置', path: '/admin/settings' });
  }
  return items;
});

const sheetActions = computed(() =>
  adminItems.value.map((i) => ({ name: i.name, path: i.path }))
);

const showSheet = ref(false);
function onSelect(action: { name?: string; path?: string }) {
  if (action.path) {
    router.push(action.path);
  }
}

// 底部 tab 高亮（单向 model-value + 计算属性，避免 v-model 双向回写类型问题）
// 管理菜单打开或在管理页面时高亮"管理"，其余按路由高亮吧台/厨房
const active = computed<number>(() => {
  if (showSheet.value) return 2;
  if (route.path.startsWith('/kitchen')) return 1;
  if (route.path.startsWith('/admin') && showManage) return 2;
  return 0; // 吧台为默认
});

function onTabChange(index: number | string) {
  const i = Number(index);
  if (i === 0) {
    router.push('/bar');
  } else if (i === 1) {
    router.push('/kitchen');
  } else if (i === 2 && showManage) {
    showSheet.value = true;
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--bg);
}
.layout-nav :deep(.van-nav-bar__title) {
  font-weight: 600;
  color: var(--text);
}
.layout-main {
  min-height: 60vh;
}
</style>
