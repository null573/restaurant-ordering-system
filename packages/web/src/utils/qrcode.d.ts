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
export declare function renderQRCode(canvas: HTMLCanvasElement, text: string, size?: number): Promise<void>;
/**
 * 生成二维码 PNG DataURL
 */
export declare function generateQRDataURL(text: string, size?: number): Promise<string>;
/**
 * 下载单个二维码
 */
export declare function downloadQRCode(data: QRCodeData): Promise<void>;
/**
 * 批量下载二维码 (生成包含多张二维码的打印页面)
 */
export declare function downloadAllQRCodes(items: QRCodeData[]): Promise<void>;
/**
 * 价格分转元
 */
export declare function fenToYuan(fen: number): string;
/**
 * 元转分
 */
export declare function yuanToFen(yuan: string | number): number;
//# sourceMappingURL=qrcode.d.ts.map