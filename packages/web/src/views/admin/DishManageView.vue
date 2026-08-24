<template>
  <div class="page dish-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <span class="page-title">菜品管理</span>
      <div class="flex gap-sm">
        <button class="btn-ghost" @click="showCategoryPopup = true">管理分类</button>
        <button class="btn-gradient btn-sm" @click="openAddDish">+ 新增菜品</button>
      </div>
    </div>

    <!-- 分类标签栏 -->
    <div class="tabs-wrap">
      <van-tabs
        v-model:active="activeTab"
        shrink
        color="var(--primary)"
        title-active-color="var(--primary)"
        @change="onTabChange"
      >
        <van-tab title="全部" />
        <van-tab v-for="cat in categories" :key="cat.id" :title="cat.name" />
      </van-tabs>
    </div>

    <!-- 菜品列表 -->
    <div class="dish-list">
      <van-pull-refresh v-model="refreshing" @refresh="loadAll">
        <div v-if="filteredDishes.length === 0 && !loading" class="empty-wrap">
          <van-empty description="暂无菜品，点击右上角新增" />
        </div>
        <div
          v-for="dish in filteredDishes"
          :key="dish.id"
          class="dish-row card"
          @click="openEditDish(dish)"
        >
          <van-image
            round
            width="64"
            height="64"
            fit="cover"
            :src="dish.image_url || undefined"
            class="dish-thumb"
          >
            <template #error>
              <div class="thumb-placeholder">
                <van-icon name="photo-o" size="22" color="#c8c9cc" />
              </div>
            </template>
            <template #loading>
              <div class="thumb-placeholder">
                <van-icon name="photo-o" size="22" color="#c8c9cc" />
              </div>
            </template>
          </van-image>

          <div class="dish-info">
            <div class="flex-between">
              <span class="dish-name">{{ dish.name }}</span>
              <span class="dish-price">¥{{ fenToYuan(dish.price_fen) }}</span>
            </div>
            <div class="dish-desc text-sm text-secondary">
              {{ dish.description || '暂无描述' }}
            </div>
            <div class="dish-meta text-sm">
              <span class="text-secondary">
                库存：{{ dish.stock < 0 ? '充足' : dish.stock }}
              </span>
              <span class="text-secondary">·</span>
              <span class="text-secondary">{{ categoryName(dish.category_id) }}</span>
            </div>
          </div>

          <div class="dish-actions" @click.stop>
            <van-switch
              :model-value="!!dish.available"
              size="22"
              @update:model-value="onToggleAvailable(dish, $event)"
            />
            <van-icon name="edit-o" size="20" color="var(--primary)" @click="openEditDish(dish)" />
            <van-icon name="delete-o" size="20" color="var(--danger)" @click="onDeleteDish(dish)" />
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 分类管理弹窗 -->
    <van-popup
      v-model:show="showCategoryPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
      :style="{ maxHeight: '80%' }"
    >
      <div class="popup-inner">
        <div class="popup-title">分类管理</div>
        <van-cell-group inset>
          <van-field
            v-model="newCategoryName"
            label="新增分类"
            placeholder="输入分类名称"
            clearable
          >
            <template #button>
              <van-button size="small" type="primary" @click="onAddCategory">添加</van-button>
            </template>
          </van-field>
        </van-cell-group>

        <div class="cat-list">
          <div v-for="cat in categories" :key="cat.id" class="cat-row">
            <van-field
              v-model="cat._editName"
              placeholder="分类名称"
              input-align="left"
              class="cat-field"
            />
            <van-button size="small" plain type="primary" @click="onRenameCategory(cat)">保存</van-button>
            <van-button size="small" plain type="danger" @click="onDeleteCategory(cat)">删除</van-button>
          </div>
          <van-empty v-if="categories.length === 0" description="暂无分类" image-size="80" />
        </div>
      </div>
    </van-popup>

    <!-- 新增/编辑菜品弹窗 -->
    <van-popup
      v-model:show="showDishPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
      :style="{ maxHeight: '90%' }"
    >
      <div class="popup-inner">
        <div class="popup-title">{{ editingDish ? '编辑菜品' : '新增菜品' }}</div>
        <van-form @submit="onSubmitDish">
          <!-- 图片上传 -->
          <div class="form-block">
            <div class="form-label">菜品图片</div>
            <van-uploader
              v-model="fileList"
              :max-count="1"
              :max-size="2 * 1024 * 1024"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :after-read="onAfterRead"
              @oversize="onOversize"
            />
            <div class="text-sm text-secondary mt-sm">支持 JPG/PNG/WebP/GIF，不超过 2MB</div>
          </div>

          <van-cell-group inset>
            <van-field
              v-model="dishForm.name"
              label="名称"
              placeholder="请输入菜品名称"
              :rules="[{ required: true, message: '请输入菜品名称' }]"
            />
            <van-field label="分类" is-link readonly :model-value="categoryLabel" @click="showCategoryPicker = true" />
            <van-field
              v-model="dishForm.priceYuan"
              label="价格(元)"
              type="number"
              placeholder="如 12.50"
              :rules="[{ required: true, message: '请输入价格' }]"
            />
            <van-field
              v-model="dishForm.description"
              label="描述"
              type="textarea"
              rows="2"
              autosize
              placeholder="菜品描述（可选）"
            />
            <van-field label="无限库存">
              <template #input>
                <van-switch v-model="dishForm.unlimitedStock" size="22" />
              </template>
            </van-field>
            <van-field
              v-if="!dishForm.unlimitedStock"
              v-model="dishForm.stock"
              label="库存"
              type="digit"
              placeholder="请输入库存数量"
            />
          </van-cell-group>

          <div class="form-actions">
            <van-button block round type="primary" native-type="submit" :loading="submitting">
              {{ editingDish ? '保存修改' : '新增菜品' }}
            </van-button>
            <van-button v-if="editingDish" block round plain type="danger" @click="onDeleteCurrent">
              删除菜品
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 分类选择 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom" round>
      <van-picker
        :columns="categoryPickerColumns"
        @confirm="onPickCategory"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Tabs as VanTabs,
  Tab as VanTab,
  PullRefresh as VanPullRefresh,
  Empty as VanEmpty,
  Image as VanImage,
  Icon as VanIcon,
  Switch as VanSwitch,
  Popup as VanPopup,
  CellGroup as VanCellGroup,
  Field as VanField,
  Button as VanButton,
  Uploader as VanUploader,
  Picker as VanPicker,
  showToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  showLoadingToast,
  closeToast,
} from 'vant';
import { menuApi } from '../../api';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
  _editName?: string;
}

interface DishRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_fen: number;
  image_url: string | null;
  available: number; // 0 | 1
  stock: number;
  sort_order: number;
  created_at: string;
}

const categories = ref<CategoryRow[]>([]);
const dishes = ref<DishRow[]>([]);
const activeTab = ref(0);
const loading = ref(false);
const refreshing = ref(false);

// 分类管理
const showCategoryPopup = ref(false);
const newCategoryName = ref('');

// 菜品弹窗
const showDishPopup = ref(false);
const editingDish = ref<DishRow | null>(null);
const submitting = ref(false);
const fileList = ref<any[]>([]);
const imageFile = ref<File | null>(null);
const showCategoryPicker = ref(false);

const dishForm = ref({
  name: '',
  categoryId: '' as string,
  priceYuan: '',
  description: '',
  stock: '0',
  unlimitedStock: true,
});

const filteredDishes = computed(() => {
  if (activeTab.value === 0) return dishes.value;
  const cat = categories.value[activeTab.value - 1];
  if (!cat) return [];
  return dishes.value.filter((d) => d.category_id === cat.id);
});

const categoryLabel = computed(() => {
  const cat = categories.value.find((c) => c.id === dishForm.value.categoryId);
  return cat ? cat.name : '请选择分类';
});

const categoryPickerColumns = computed(() =>
  [{ text: '不选分类', value: '' }, ...categories.value.map((c) => ({ text: c.name, value: c.id }))]
);

function categoryName(id: string | null): string {
  if (!id) return '未分类';
  const cat = categories.value.find((c) => c.id === id);
  return cat ? cat.name : '未分类';
}

async function loadAll() {
  loading.value = true;
  try {
    const [catRes, dishRes] = (await Promise.all([
      menuApi.getCategories(),
      menuApi.getDishes(),
    ])) as [any, any];
    categories.value = (catRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      _editName: c.name,
    }));
    dishes.value = dishRes.data || [];
  } catch (e: any) {
    showFailToast(e.message || '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function onTabChange() {
  // 列表为客户端过滤，无需额外请求
}

// ===== 分类管理 =====
async function onAddCategory() {
  const name = newCategoryName.value.trim();
  if (!name) {
    showToast('请输入分类名称');
    return;
  }
  try {
    await menuApi.addCategory({ name });
    newCategoryName.value = '';
    showSuccessToast('添加成功');
    await loadAll();
  } catch (e: any) {
    showFailToast(e.message || '添加失败');
  }
}

async function onRenameCategory(cat: CategoryRow) {
  const name = (cat._editName || '').trim();
  if (!name) {
    showToast('分类名称不能为空');
    return;
  }
  try {
    await menuApi.updateCategory(cat.id, { name });
    showSuccessToast('已保存');
    await loadAll();
  } catch (e: any) {
    showFailToast(e.message || '保存失败');
  }
}

async function onDeleteCategory(cat: CategoryRow) {
  try {
    await showConfirmDialog({
      title: '删除分类',
      message: `确定删除分类「${cat.name}」吗？`,
    });
  } catch {
    return;
  }
  try {
    const res: any = await menuApi.deleteCategory(cat.id);
    if (res.code === 0) {
      showSuccessToast('删除成功');
      await loadAll();
    } else {
      showFailToast(res.message || '删除失败');
    }
  } catch (e: any) {
    showFailToast(e.message || '删除失败');
  }
}

// ===== 菜品管理 =====
function openAddDish() {
  editingDish.value = null;
  dishForm.value = {
    name: '',
    categoryId: categories.value[0]?.id || '',
    priceYuan: '',
    description: '',
    stock: '0',
    unlimitedStock: true,
  };
  fileList.value = [];
  imageFile.value = null;
  showDishPopup.value = true;
}

function openEditDish(dish: DishRow) {
  editingDish.value = dish;
  dishForm.value = {
    name: dish.name,
    categoryId: dish.category_id || '',
    priceYuan: fenToYuan(dish.price_fen),
    description: dish.description || '',
    stock: dish.stock < 0 ? '0' : String(dish.stock),
    unlimitedStock: dish.stock < 0,
  };
  fileList.value = dish.image_url ? [{ url: dish.image_url }] : [];
  imageFile.value = null;
  showDishPopup.value = true;
}

function onPickCategory({ selectedValues }: { selectedValues: (string | number)[] }) {
  dishForm.value.categoryId = selectedValues[0] != null ? String(selectedValues[0]) : '';
  showCategoryPicker.value = false;
}

function onAfterRead(item: any) {
  imageFile.value = item.file;
}

function onOversize() {
  showFailToast('图片大小不能超过 2MB');
}

async function onSubmitDish() {
  if (submitting.value) return;
  submitting.value = true;
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });

  const payload: any = {
    name: dishForm.value.name.trim(),
    categoryId: dishForm.value.categoryId || null,
    priceFen: yuanToFen(dishForm.value.priceYuan),
    description: dishForm.value.description.trim() || null,
    stock: dishForm.value.unlimitedStock ? -1 : parseInt(dishForm.value.stock || '0', 10),
  };

  try {
    if (editingDish.value) {
      await menuApi.updateDish(editingDish.value.id, payload);
      if (imageFile.value) {
        const upRes: any = await menuApi.uploadImage(editingDish.value.id, imageFile.value);
        if (upRes.code !== 0) {
          closeToast();
          showFailToast(upRes.message || '图片上传失败');
          return;
        }
      }
      closeToast();
      showSuccessToast('保存成功');
    } else {
      const res: any = await menuApi.addDish(payload);
      if (res.code !== 0) {
        closeToast();
        showFailToast(res.message || '新增失败');
        return;
      }
      const newId = res.data?.id;
      if (newId && imageFile.value) {
        const upRes: any = await menuApi.uploadImage(newId, imageFile.value);
        if (upRes.code !== 0) {
          closeToast();
          showFailToast(upRes.message || '图片上传失败');
        }
      }
      closeToast();
      showSuccessToast('新增成功');
    }
    showDishPopup.value = false;
    await loadAll();
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

async function onToggleAvailable(dish: DishRow, val: boolean) {
  // 立即更新本地状态，避免开关回弹
  dish.available = val ? 1 : 0;
  try {
    await menuApi.updateDish(dish.id, { available: val });
    showToast(val ? '已上架' : '已下架');
  } catch (e: any) {
    dish.available = val ? 0 : 1; // 回滚
    showFailToast(e.message || '操作失败');
  }
}

async function onDeleteDish(dish: DishRow) {
  try {
    await showConfirmDialog({
      title: '删除菜品',
      message: `确定删除「${dish.name}」吗？`,
    });
  } catch {
    return;
  }
  try {
    const res: any = await menuApi.deleteDish(dish.id);
    if (res.code === 0) {
      showSuccessToast('删除成功');
      showDishPopup.value = false;
      await loadAll();
    } else {
      showFailToast(res.message || '删除失败');
    }
  } catch (e: any) {
    showFailToast(e.message || '删除失败');
  }
}

function onDeleteCurrent() {
  if (editingDish.value) onDeleteDish(editingDish.value);
}

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.dish-page {
  padding-bottom: 40px;
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
.btn-ghost {
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
}
.btn-sm {
  padding: 6px 14px !important;
  font-size: 13px !important;
}
.tabs-wrap {
  background: var(--card-bg);
  box-shadow: var(--shadow);
}
.dish-list {
  padding: 12px;
}
.dish-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.dish-thumb {
  flex-shrink: 0;
}
.thumb-placeholder {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border-radius: 50%;
}
.dish-info {
  flex: 1;
  min-width: 0;
}
.dish-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.dish-price {
  color: var(--primary);
  font-weight: 700;
  font-size: 15px;
}
.dish-desc {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dish-meta {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}
.dish-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.empty-wrap {
  padding: 40px 0;
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
.cat-list {
  padding: 8px 0;
}
.cat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
}
.cat-field {
  flex: 1;
}
.form-block {
  padding: 12px 16px;
}
.form-label {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 8px;
  font-weight: 500;
}
.form-actions {
  padding: 24px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
