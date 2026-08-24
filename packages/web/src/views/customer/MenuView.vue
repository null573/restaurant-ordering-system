<template>
  <div class="page menu-page">
    <!-- 顶部餐厅信息 -->
    <div class="menu-header">
      <div class="header-info">
        <div class="tenant-name">{{ tenantName || '餐厅' }}</div>
        <div class="desk-info">{{ deskLabel }}</div>
      </div>
      <div class="header-tag">扫码点餐</div>
    </div>

    <!-- 加载中 -->
    <div v-if="!loaded" class="loading-box">
      <van-loading>菜单加载中...</van-loading>
    </div>

    <!-- 菜单主体：左侧分类 + 右侧菜品 -->
    <div v-else class="menu-body">
      <van-sidebar v-model="activeCategory" class="menu-sidebar">
        <van-sidebar-item
          v-for="cat in categoryList"
          :key="cat.id || 'all'"
          :title="cat.name"
          :badge="categoryCount(cat.id)"
        />
      </van-sidebar>

      <div class="menu-content">
        <van-empty v-if="filteredDishes.length === 0" description="该分类暂无菜品" image-size="100" />

        <div v-else class="dish-grid">
          <div
            v-for="dish in filteredDishes"
            :key="dish.id"
            class="dish-card card"
          >
            <van-image
              lazy-load
              fit="cover"
              :src="dish.image_url || ''"
              class="dish-img"
            >
              <template #error>
                <div class="img-placeholder">
                  <van-icon name="photo-o" size="28" color="#c8c9cc" />
                </div>
              </template>
              <template #loading>
                <div class="img-placeholder">
                  <van-icon name="photo-o" size="28" color="#c8c9cc" />
                </div>
              </template>
            </van-image>

            <div class="dish-info">
              <div class="dish-name">{{ dish.name }}</div>
              <div class="dish-desc text-sm text-secondary">
                {{ dish.description || '美味推荐' }}
              </div>
              <div class="dish-bottom">
                <span class="dish-price">¥{{ fenToYuan(dish.price_fen) }}</span>
                <van-button
                  type="primary"
                  size="small"
                  round
                  :icon="cartCount(dish.id) > 0 ? 'plus' : undefined"
                  @click="addToCart(dish)"
                >
                  {{ cartCount(dish.id) > 0 ? `已选 ${cartCount(dish.id)}` : '加入' }}
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部购物车栏 -->
    <van-submit-bar
      :price="totalFen"
      button-text="去结算"
      :disabled="totalCount === 0"
      :tip="totalCount === 0 ? '请先选择菜品' : ''"
      @submit="goCheckout"
    >
      <span class="cart-summary">已选 {{ totalCount }} 件</span>
    </van-submit-bar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Sidebar as VanSidebar,
  SidebarItem as VanSidebarItem,
  Image as VanImage,
  Button as VanButton,
  Icon as VanIcon,
  SubmitBar as VanSubmitBar,
  Empty as VanEmpty,
  Loading as VanLoading,
  showToast,
  showFailToast,
} from 'vant';
import { customerApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';

interface CategoryItem {
  id: string;
  name: string;
  sort_order: number;
}

interface DishItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_fen: number;
  image_url: string | null;
  available: number;
  stock: number;
}

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

const tenantName = ref('');
const deskNumber = ref('');
const deskName = ref<string | null>(null);
const categories = ref<CategoryItem[]>([]);
const dishes = ref<DishItem[]>([]);
const cart = ref<CartItem[]>([]);
const loaded = ref(false);
const activeCategory = ref(0); // 0 = 全部

// 分类列表，首位为「全部」
const categoryList = computed(() => [
  { id: '', name: '全部', sort_order: -1 },
  ...categories.value,
]);

const filteredDishes = computed(() => {
  if (activeCategory.value === 0) return dishes.value;
  const cat = categoryList.value[activeCategory.value];
  if (!cat) return [];
  return dishes.value.filter((d) => d.category_id === cat.id);
});

const deskLabel = computed(() => {
  if (deskName.value) return `${deskName.value}（桌号 ${deskNumber.value}）`;
  return `桌号 ${deskNumber.value}`;
});

const totalCount = computed(() =>
  cart.value.reduce((sum, i) => sum + i.quantity, 0),
);

const totalFen = computed(() =>
  cart.value.reduce((sum, i) => sum + i.priceFen * i.quantity, 0),
);

function categoryCount(catId: string): number | undefined {
  const list = catId
    ? dishes.value.filter((d) => d.category_id === catId)
    : dishes.value;
  const n = list.length;
  return n > 0 ? n : undefined;
}

function cartCount(dishId: string): number {
  return cart.value.find((c) => c.dishId === dishId)?.quantity || 0;
}

function saveCart() {
  sessionStorage.setItem(cartStorageKey, JSON.stringify(cart.value));
}

function addToCart(dish: DishItem) {
  const existing = cart.value.find((c) => c.dishId === dish.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.value.push({
      dishId: dish.id,
      name: dish.name,
      priceFen: dish.price_fen,
      quantity: 1,
    });
  }
  saveCart();
  showToast(`已加入 ${dish.name}`);
}

function goCheckout() {
  if (cart.value.length === 0) {
    showFailToast('购物车是空的');
    return;
  }
  router.push(`/c/${qrToken}/checkout`);
}

onMounted(async () => {
  try {
    const res: any = await customerApi.getMenu(qrToken);
    const data = res.data || {};
    tenantName.value = data.tenantName || '';
    deskNumber.value = data.deskNumber || '';
    deskName.value = data.deskName ?? null;
    categories.value = (data.categories || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
    }));
    dishes.value = (data.dishes || []).map((d: any) => ({
      id: d.id,
      category_id: d.category_id,
      name: d.name,
      description: d.description,
      price_fen: d.price_fen,
      image_url: d.image_url,
      available: d.available,
      stock: d.stock,
    }));

    // 恢复未结算的购物车
    const saved = sessionStorage.getItem(cartStorageKey);
    if (saved) {
      try {
        cart.value = JSON.parse(saved);
      } catch {
        cart.value = [];
      }
    }
  } catch (err: any) {
    showFailToast(err?.response?.data?.message || err?.message || '获取菜单失败');
  } finally {
    loaded.value = true;
  }
});
</script>

<style scoped>
.menu-page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 60px;
}
.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: #fff;
  box-shadow: var(--shadow);
}
.tenant-name {
  font-size: 18px;
  font-weight: 700;
}
.desk-info {
  font-size: 13px;
  opacity: 0.92;
  margin-top: 4px;
}
.header-tag {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 10px;
  border-radius: 12px;
}
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}
.menu-body {
  display: flex;
  align-items: flex-start;
}
.menu-sidebar {
  flex-shrink: 0;
  width: 92px;
  position: sticky;
  top: 0;
  align-self: flex-start;
}
.menu-content {
  flex: 1;
  min-width: 0;
  padding: 12px;
}
.dish-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.dish-card {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dish-img {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}
.dish-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dish-img :deep(.van-image__error),
.dish-img :deep(.van-image__loading) {
  width: 100%;
  height: 100%;
}
.img-placeholder {
  width: 100%;
  height: 100%;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}
.dish-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dish-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dish-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-height: 18px;
}
.dish-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}
.dish-price {
  color: var(--primary);
  font-weight: 700;
  font-size: 15px;
}
.cart-summary {
  font-size: 13px;
  color: var(--text-secondary);
  padding-left: 8px;
}
</style>
