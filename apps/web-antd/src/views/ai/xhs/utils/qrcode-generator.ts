/**
 * 二维码生成工具类
 * 用于生成包含分享链接的二维码
 */

import QRCode from 'qrcode';

// 二维码生成选项
export interface QRCodeOptions {
  /** 二维码尺寸 */
  width?: number;
  /** 错误纠正级别 */
  errorCorrectionLevel?: 'H' | 'L' | 'M' | 'Q';
  /** 边距 */
  margin?: number;
  /** 前景色 */
  color?: {
    dark?: string;
    light?: string;
  };
}

// 默认二维码配置
const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 256,
  errorCorrectionLevel: 'M',
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

/**
 * 生成二维码数据URL
 * @param text 要编码的文本（通常是分享链接）
 * @param options 二维码选项
 * @returns Promise<string> 二维码的base64数据URL
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {},
): Promise<string> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: mergedOptions.width,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('生成二维码失败:', error);
    throw new Error('生成二维码失败，请重试');
  }
}

/**
 * 生成小红书分享专用二维码
 * @param shareUrl 分享链接
 * @returns Promise<string> 二维码的base64数据URL
 */
export async function generateXhsShareQRCode(
  shareUrl: string,
): Promise<string> {
  const options: QRCodeOptions = {
    width: 200,
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#FF2442', // 小红书品牌色
      light: '#FFFFFF',
    },
  };

  return generateQRCode(shareUrl, options);
}

/**
 * 生成二维码Canvas元素
 * @param text 要编码的文本
 * @param options 二维码选项
 * @returns Promise<HTMLCanvasElement> Canvas元素
 */
export async function generateQRCodeCanvas(
  text: string,
  options: QRCodeOptions = {},
): Promise<HTMLCanvasElement> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const canvas = document.createElement('canvas');

    await QRCode.toCanvas(canvas, text, {
      width: mergedOptions.width,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
    });

    return canvas;
  } catch (error) {
    console.error('生成二维码Canvas失败:', error);
    throw new Error('生成二维码Canvas失败，请重试');
  }
}

/**
 * 下载二维码图片
 * @param text 要编码的文本
 * @param filename 文件名（不含扩展名）
 * @param options 二维码选项
 */
export async function downloadQRCode(
  text: string,
  filename: string = 'qrcode',
  options: QRCodeOptions = {},
): Promise<void> {
  try {
    const canvas = await generateQRCodeCanvas(text, options);

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');

    // 触发下载
    document.body.append(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('下载二维码失败:', error);
    throw new Error('下载二维码失败，请重试');
  }
}

/**
 * 验证文本是否适合生成二维码
 * @param text 要验证的文本
 * @returns boolean 是否适合
 */
export function validateQRCodeText(text: string): boolean {
  // 检查文本长度（二维码有容量限制）
  if (!text || text.length === 0) {
    return false;
  }

  // 对于URL，检查长度限制（通常建议不超过2000字符）
  if (text.length > 2000) {
    console.warn('文本过长，可能影响二维码扫描效果');
    return false;
  }

  return true;
}

/**
 * 获取二维码推荐尺寸
 * @param containerWidth 容器宽度
 * @returns 推荐的二维码尺寸
 */
export function getRecommendedQRCodeSize(containerWidth: number): number {
  // 根据容器宽度计算合适的二维码尺寸
  const minSize = 120;
  const maxSize = 300;
  const recommendedSize = Math.min(containerWidth * 0.8, maxSize);

  return Math.max(recommendedSize, minSize);
}
