/**
 * 二维码生成工具 - 前端 Canvas 生成 + 下载
 */
import QRCode from 'qrcode';

export interface QRCodeData {
  deskId: string;
  deskNumber: string;
  deskName: string | null;
  qrToken: string;
  qrUrl: string;
}

/**
 * 在 Canvas 上渲染二维码
 */
export async function renderQRCode(canvas: HTMLCanvasElement, text: string, size = 256): Promise<void> {
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

/**
 * 生成二维码 PNG DataURL
 */
export async function generateQRDataURL(text: string, size = 256): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

/**
 * 下载单个二维码
 */
export async function downloadQRCode(data: QRCodeData): Promise<void> {
  const dataUrl = await generateQRDataURL(data.qrUrl, 512);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `桌号${data.deskNumber}-二维码.png`;
  link.click();
}

/**
 * 批量下载二维码 (生成包含多张二维码的打印页面)
 */
export async function downloadAllQRCodes(items: QRCodeData[]): Promise<void> {
  // 生成一个包含所有二维码的 HTML 打印页面
  const qrPromises = items.map(async (item) => {
    const dataUrl = await generateQRDataURL(item.qrUrl, 400);
    return { ...item, dataUrl };
  });
  const qrs = await Promise.all(qrPromises);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>桌位二维码批量打印</title>
<style>
  @page { size: A4; margin: 1cm; }
  body { font-family: sans-serif; }
  .grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
  .qr-item { text-align: center; padding: 10px; border: 1px dashed #ccc; border-radius: 8px; }
  .qr-item img { width: 200px; height: 200px; }
  .desk-label { font-size: 18px; font-weight: bold; margin-top: 8px; }
  .desk-name { font-size: 12px; color: #666; }
</style></head>
<body>
<div class="grid">
  ${qrs.map(q => `
    <div class="qr-item">
      <img src="${q.dataUrl}" />
      <div class="desk-label">${q.deskNumber}</div>
      ${q.deskName ? `<div class="desk-name">${q.deskName}</div>` : ''}
    </div>
  `).join('')}
</div>
<script>window.print();</script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * 价格分转元
 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

/**
 * 元转分
 */
export function yuanToFen(yuan: string | number): number {
  return Math.round(parseFloat(String(yuan)) * 100);
}
