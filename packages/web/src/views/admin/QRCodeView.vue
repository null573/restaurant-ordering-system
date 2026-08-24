<template>
  <div class="page qr-page">
    <div class="page-header">
      <span class="page-title">桌位二维码</span>
      <span class="text-sm text-secondary">共 {{ qrList.length }} 个</span>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="loadQR">
      <div v-if="loading" class="loading-wrap">
        <van-loading size="24">加载中...</van-loading>
      </div>

      <div v-else-if="qrList.length === 0" class="empty-wrap">
        <van-empty description="暂无桌位二维码，请先添加桌位" />
      </div>

      <!-- 二维码网格 -->
      <div v-else ref="gridRef" class="qr-grid">
        <div v-for="item in qrList" :key="item.deskId" class="qr-card card">
          <canvas class="qr-canvas" :data-token="item.qrToken"></canvas>
          <div class="qr-desk-no">{{ item.deskNumber }}</div>
          <div v-if="item.deskName" class="qr-desk-name text-sm text-secondary">
            {{ item.deskName }}
          </div>
          <van-button
            size="small"
            plain
            type="primary"
            icon="down"
            class="qr-dl-btn"
            @click="onDownloadOne(item)"
          >
            下载
          </van-button>
        </div>
      </div>
    </van-pull-refresh>

    <!-- 底部批量操作 -->
    <div v-if="qrList.length" class="qr-footer">
      <van-button block round type="primary" icon="printer" @click="onDownloadAll" :loading="downloadingAll">
        批量下载打印
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import {
  PullRefresh as VanPullRefresh,
  Empty as VanEmpty,
  Loading as VanLoading,
  Button as VanButton,
  showToast,
  showFailToast,
  showSuccessToast,
  showLoadingToast,
  closeToast,
} from 'vant';
import { deskApi } from '../../api';
import {
  renderQRCode,
  downloadQRCode,
  downloadAllQRCodes,
  type QRCodeData,
} from '../../utils/qrcode';

const qrList = ref<QRCodeData[]>([]);
const gridRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const refreshing = ref(false);
const downloadingAll = ref(false);

async function loadQR() {
  loading.value = true;
  try {
    const res: any = await deskApi.getAllQRCodes();
    qrList.value = (res.data || []) as QRCodeData[];
    // 等待 DOM 渲染出 canvas 后再绘制
    await nextTick();
    await renderAll();
  } catch (e: any) {
    showFailToast(e.message || '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function renderAll() {
  const canvases = gridRef.value?.querySelectorAll<HTMLCanvasElement>('canvas.qr-canvas');
  if (!canvases || canvases.length === 0) return;
  // 逐个渲染，失败不影响其他
  const tasks: Promise<void>[] = [];
  canvases.forEach((canvas) => {
    const token = canvas.dataset.token;
    const item = qrList.value.find((d) => d.qrToken === token);
    if (!item) return;
    tasks.push(
      renderQRCode(canvas, item.qrUrl, 256).catch(() => {
        /* 单个渲染失败忽略 */
      })
    );
  });
  await Promise.all(tasks);
}

async function onDownloadOne(item: QRCodeData) {
  try {
    await downloadQRCode(item);
    showToast('已下载');
  } catch (e: any) {
    showFailToast(e.message || '下载失败');
  }
}

async function onDownloadAll() {
  if (downloadingAll.value) return;
  downloadingAll.value = true;
  showLoadingToast({ message: '生成打印页...', forbidClick: true, duration: 0 });
  try {
    await downloadAllQRCodes(qrList.value);
    closeToast();
    showSuccessToast('已生成打印页');
  } catch (e: any) {
    closeToast();
    showFailToast(e.message || '生成失败');
  } finally {
    downloadingAll.value = false;
  }
}

onMounted(() => {
  loadQR();
});
</script>

<style scoped>
.qr-page {
  padding-bottom: 96px;
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
.loading-wrap,
.empty-wrap {
  padding: 48px 0;
  display: flex;
  justify-content: center;
}
.qr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
}
.qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px;
}
.qr-canvas {
  width: 150px;
  height: 150px;
  display: block;
}
.qr-desk-no {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-top: 10px;
}
.qr-desk-name {
  margin-top: 2px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qr-dl-btn {
  margin-top: 12px;
}
.qr-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}
</style>
