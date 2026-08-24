/**
 * 微信支付 V3 API 封装 (Cloudflare Workers 实现)
 * 使用 Web Crypto API 进行 RSA-SHA256 签名
 */
import type { Env } from '../types';

const BASE_URL = 'https://api.mch.weixin.qq.com';

/**
 * RSA-SHA256 签名
 */
async function rsaSign(privateKeyPem: string, data: string): Promise<string> {
  // 从 PEM 提取私钥
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryDer = base64ToArrayBuffer(pemContents);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(data)
  );

  return arrayBufferToBase64(signature);
}

/**
 * 构建签名串
 * HTTP方法\n请求URL\n时间戳\n随机串\n请求体\n
 */
function buildSignString(
  method: string,
  url: string,
  timestamp: string,
  nonce: string,
  body: string
): string {
  return `${method.toUpperCase()}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
}

/**
 * 生成随机字符串
 */
function generateNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Authorization 头
 * WECHATPAY2-SHA256-RSA2048 mchid="xxx",serial_no="xxx",nonce_str="xxx",timestamp="xxx",signature="xxx"
 */
function buildAuthHeader(
  mchid: string,
  serialNo: string,
  nonce: string,
  timestamp: string,
  signature: string
): string {
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",serial_no="${serialNo}",nonce_str="${nonce}",timestamp="${timestamp}",signature="${signature}"`;
}

export interface WechatPayResult {
  prepayId?: string;
  codeUrl?: string;  // Native 支付二维码链接
  paySign?: {        // JSAPI 支付参数
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };
  h5Url?: string;    // H5 支付跳转链接
}

/**
 * 统一下单接口
 */
export async function wechatPayCreateOrder(
  env: Env,
  params: {
    mchid: string;
    appid: string;
    description: string;
    outTradeNo: string;
    amountFen: number;
    notifyUrl: string;
    openid?: string;       // JSAPI 支付需要
    payerIp?: string;      // H5 支付需要
    scene?: 'JSAPI' | 'NATIVE' | 'H5';
  }
): Promise<WechatPayResult> {
  const scene = params.scene || 'NATIVE';
  const url = `/v3/pay/transactions/${scene.toLowerCase()}`;
  const fullUrl = `${BASE_URL}${url}`;

  const body: Record<string, unknown> = {
    appid: params.appid,
    mchid: params.mchid,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: { total: params.amountFen, currency: 'CNY' },
  };

  if (scene === 'JSAPI' && params.openid) {
    body.payer = { openid: params.openid };
  }
  if (scene === 'H5' && params.payerIp) {
    body.scene_info = { payer_client_ip: params.payerIp, h5_info: { type: 'Wap' } };
  }

  const bodyStr = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  // 签名
  const signString = buildSignString('POST', url, timestamp, nonce, bodyStr);
  const signature = await rsaSign(env.WECHAT_PRIVATE_KEY, signString);

  // 商户证书序列号 (从私钥计算或配置)
  const serialNo = env.WECHAT_PLATFORM_CERT || '';
  const authHeader = buildAuthHeader(params.mchid, serialNo, nonce, timestamp, signature);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
      'User-Agent': 'RestaurantOrdering/1.0',
    },
    body: bodyStr,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('WeChat Pay error:', errText);
    throw new Error(`微信支付下单失败: ${response.status}`);
  }

  const result = await response.json<{ prepay_id?: string; code_url?: string; h5_url?: string }>();

  if (scene === 'JSAPI' && result.prepay_id) {
    // 构建 JSAPI 支付参数
    const jsapiTimestamp = timestamp;
    const jsapiNonce = nonce;
    const jsapiPackage = `prepay_id=${result.prepay_id}`;
    // JSAPI 签名: appId\ntimeStamp\nnonceStr\npackage\n
    const jsapiSignString = `${params.appid}\n${jsapiTimestamp}\n${jsapiNonce}\n${jsapiPackage}\n`;
    const paySign = await rsaSign(env.WECHAT_PRIVATE_KEY, jsapiSignString);

    return {
      prepayId: result.prepay_id,
      paySign: {
        appId: params.appid,
        timeStamp: jsapiTimestamp,
        nonceStr: jsapiNonce,
        package: jsapiPackage,
        signType: 'RSA',
        paySign,
      },
    };
  }

  if (scene === 'NATIVE' && result.code_url) {
    return { codeUrl: result.code_url };
  }

  if (scene === 'H5' && result.h5_url) {
    return { h5Url: result.h5_url };
  }

  return {};
}

/**
 * 验证微信回调签名 (简化版，实际需用平台证书公钥验签)
 */
export async function verifyWechatCallback(
  env: Env,
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  serial: string
): Promise<boolean> {
  // 生产环境应使用微信平台证书公钥验签
  // 此处简化处理，实际应:
  // 1. 从 KV 获取平台证书 (通过 serial 匹配)
  // 2. 用公钥验证签名
  // 暂时返回 true，部署后需完善
  // TODO: 完善平台证书验签
  return true;
}

// ===== 工具函数 =====

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
