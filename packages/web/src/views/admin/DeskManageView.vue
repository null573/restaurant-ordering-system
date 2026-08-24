<template>
  <div class="page desk-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <span class="page-title">桌位管理</span>
      <div class="flex gap-sm">
        <button class="btn-ghost" @click="showBatchPopup = true">批量新增</button>
        <button class="btn-gradient btn-sm" @click="openAddDesk">+ 新增桌位</button>
      </div>
    </div>

    <!-- 桌位列表 -->
    <div class="desk-list">
      <van-pull-refresh v-model="refreshing" @refresh="loadDesks">
        <div v-if="desks.length === 0 && !loading" class="empty-wrap">
          <van-empty description="暂无桌位，点击右上角新增" />
        </div>

        <van-cell-group inset v-if="desks.length">
          <div
            v-for="desk in desks"
            :key="desk.id"
            class="desk-row"
          >
            <div class="desk-no">{{ desk.number }}</div>
            <div class="desk-info">
              <div class="desk-name">{{ desk.name || `桌位 ${desk.number}` }}</div>
              <div class="text-sm text-secondary">容量：{{ desk.capacity }} 人</div>
            </div>
            <div class="desk-actions">
              <van-tag plain type="success" size="medium">
                {{ statusText(desk.status) }}
              </van-tag>
              <van-icon name="scan" size="22" color="var(--primary)" @click="goQRCodes" />
              <van-icon name="edit-o" size="20" color="var(--primary)" @click="openEditDesk(desk)" />
              <van-icon name="delete-o" size="20" color="var(--danger)" @click="onDeleteDesk(desk)" />
            </div>
          </div>
        </van-cell-group>
      </van-pull-refresh>
    </div>

    <!-- 二维码入口提示 -->
    <div class="qr-entry" @click="goQRCodes">
      <van-icon name="scan" size="22" color="var(--primary)" />
      <span>查看 / 下载所有桌位二维码</span>
      <van-icon name="arrow" size="14" color="var(--text-secondary)" />
    </div>

    <!-- 新增/编辑桌位弹窗 -->
    <van-popup
      v-model:show="showDeskPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
    >
      <div class="popup-inner">
        <div class="popup-title">{{ editingDesk ? '编辑桌位' : '新增桌位' }}</div>
        <van-form @submit="onSubmitDesk">
          <van-cell-group inset>
            <van-field
              v-model="deskForm.number"
              label="桌号"
              placeholder="如 A1"
              :rules="[{ required: true, message: '请输入桌号' }]"
            />
            <van-field
              v-model="deskForm.name"
              label="名称"
              placeholder="如 大厅A1（可选）"
            />
            <van-field label="容量" :model-value="`${deskForm.capacity} 人`">
              <template #input>
                <van-stepper v-model="deskForm.capacity" min="1" max="50" />
              </template>
            </van-field>
          </van-cell-group>

          <div class="form-actions">
            <van-button block round type="primary" native-type="submit" :loading="submitting">
              {{ editingDesk ? '保存修改' : '新增' }}
            </van-button>
            <van-button v-if="editingDesk" block round plain type="danger" @click="onDeleteCurrentDesk">
              删除桌位
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 批量新增弹窗 -->
    <van-popup
      v-model:show="showBatchPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
    >
      <div class="popup-inner">
        <div class="popup-title">批量新增桌位</div>
        <van-form @submit="onSubmitBatch">
          <van-cell-group inset>
            <van-field
              v-model="batchForm.prefix"
              label="前缀"
              placeholder="如 A"
              :rules="[{ required: true, message: '请输入前缀' }]"
            />
            <van-field
              v-model="batchForm.start"
              label="起始号"
              type="digit"
              placeholder="如 1"
              :rules="[{ required: true, message: '请输入起始号' }]"
            />
            <van-field
              v-model="batchForm.count"
              label="数量"
              type="digit"
              placeholder="如 10"
              :rules="[{ required: true, message: '请输入数量' }]"
            />
            <van-field label="容量" :model-value="`${batchForm.capacity} 人`">
              <template #input>
                <van-stepper v-model="batchForm.capacity" min="1" max="50" />
              </template>
            </van-field>
          </van-cell-group>

          <div class="batch-preview text-sm text-secondary">
            预览：{{ batchPreview }}
          </div>

          <div class="form-actions">
            <van-button block round type="primary" native-type="submit" :loading="submitting">
              批量创建
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  PullRefresh as VanPullRefresh,
  Empty as VanEmpty,
  CellGroup as VanCellGroup,
  Tag as VanTag,
  Icon as VanIcon,
  Popup as VanPopup,
  Field as VanField,
  Button as VanButton,
  Stepper as VanStepper,
  showToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  showLoadingToast,
  closeToast,
} from 'vant';
import { deskApi } from '../../api';

interface DeskRow {
  id: string;
  number: string;
  name: string | null;
  capacity: number;
  qr_token: string;
  status: string;
  created_at: string;
}

const router = useRouter();
const desks = ref<DeskRow[]>([]);
const loading = ref(false);
const refreshing = ref(false);

const showDeskPopup = ref(false);
const showBatchPopup = ref(false);
const editingDesk = ref<DeskRow | null>(null);
const submitting = ref(false);

const deskForm = ref({
  number: '',
  name: '',
  capacity: 4,
});

const batchForm = ref({
  prefix: 'A',
  start: '1',
  count: '10',
  capacity: 4,
});

const batchPreview = computed(() => {
  const { prefix, start, count } = batchForm.value;
  const s = parseInt(start, 10);
  const c = parseInt(count, 10);
  if (!prefix || !s || !c) return '请填写完整';
  if (c <= 2) return [prefix + s, prefix + (s + 1)].join('、');
  return `${prefix}${s}、${prefix}${s + 1} ... ${prefix}${s + c - 1}`;
});

function statusText(status: string): string {
  switch (status) {
    case 'idle': return '空闲';
    case 'occupied': return '使用中';
    case 'paying': return '结账中';
    default: return status;
  }
}

async function loadDesks() {
  loading.value = true;
  try {
    const res: any = await deskApi.list();
    desks.value = res.data || [];
  } catch (e: any) {
    showFailToast(e.message || '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function goQRCodes() {
  router.push('/admin/qrcodes');
}

function openAddDesk() {
  editingDesk.value = null;
  deskForm.value = { number: '', name: '', capacity: 4 };
  showDeskPopup.value = true;
}

function openEditDesk(desk: DeskRow) {
  editingDesk.value = desk;
  deskForm.value = {
    number: desk.number,
    name: desk.name || '',
    capacity: desk.capacity,
  };
  showDeskPopup.value = true;
}

async function onSubmitDesk() {
  if (submitting.value) return;
  submitting.value = true;
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
  try {
    const payload = {
      number: deskForm.value.number.trim(),
      name: deskForm.value.name.trim() || undefined,
      capacity: deskForm.value.capacity,
    };
    if (editingDesk.value) {
      const res: any = await deskApi.update(editingDesk.value.id, payload);
      if (res.code !== 0) {
        closeToast();
        showFailToast(res.message || '保存失败');
        return;
      }
    } else {
      const res: any = await deskApi.add(payload);
      if (res.code !== 0) {
        closeToast();
        showFailToast(res.message || '新增失败');
        return;
      }
    }
    closeToast();
    showSuccessToast('保存成功');
    showDeskPopup.value = false;
    await loadDesks();
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

async function onSubmitBatch() {
  const prefix = batchForm.value.prefix.trim();
  const start = parseInt(batchForm.value.start, 10);
  const count = parseInt(batchForm.value.count, 10);
  if (!prefix || !start || !count) {
    showToast('请填写完整');
    return;
  }
  if (count > 200) {
    showFailToast('单次最多创建 200 个');
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  showLoadingToast({ message: '创建中...', forbidClick: true, duration: 0 });
  try {
    const res: any = await deskApi.batch({
      prefix,
      start,
      count,
      capacity: batchForm.value.capacity,
    });
    if (res.code !== 0) {
      closeToast();
      showFailToast(res.message || '批量创建失败');
      return;
    }
    closeToast();
    showSuccessToast(`成功创建 ${count} 个桌位`);
    showBatchPopup.value = false;
    await loadDesks();
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '批量创建失败');
  } finally {
    submitting.value = false;
  }
}

async function onDeleteDesk(desk: DeskRow) {
  try {
    await showConfirmDialog({
      title: '删除桌位',
      message: `确定删除桌位「${desk.number}」吗？`,
    });
  } catch {
    return;
  }
  try {
    const res: any = await deskApi.remove(desk.id);
    if (res.code === 0) {
      showSuccessToast('删除成功');
      showDeskPopup.value = false;
      await loadDesks();
    } else {
      showFailToast(res.message || '删除失败');
    }
  } catch (e: any) {
    showFailToast(e.message || '删除失败');
  }
}

function onDeleteCurrentDesk() {
  if (editingDesk.value) onDeleteDesk(editingDesk.value);
}

onMounted(() => {
  loadDesks();
});
</script>

<style scoped>
.desk-page {
  padding-bottom: 80px;
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
.desk-list {
  padding: 12px 0;
}
.desk-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.desk-row:last-child {
  border-bottom: none;
}
.desk-no {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  min-width: 48px;
}
.desk-info {
  flex: 1;
  min-width: 0;
}
.desk-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.desk-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.empty-wrap {
  padding: 40px 0;
}
.qr-entry {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  background: var(--card-bg);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow);
  color: var(--primary);
  font-weight: 600;
}
.qr-entry span {
  flex: 1;
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
.batch-preview {
  padding: 12px 28px 0;
}
.form-actions {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
