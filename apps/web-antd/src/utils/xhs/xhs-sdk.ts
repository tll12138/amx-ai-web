/**
 * 小红书SDK封装类
 * 提供SDK动态加载和分享功能
 */

import type { XhsShareConfig } from '../../../types/xhs';

// 小红书SDK配置
const XHS_SDK_CONFIG = {
  SDK_URL: 'https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js',
  LOAD_TIMEOUT: 10_000, // 10秒超时
} as const;

export class XhsSDK {
  private static instance: XhsSDK;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: null | Promise<void> = null;

  /**
   * 获取SDK单例实例
   */
  public static getInstance(): XhsSDK {
    if (!XhsSDK.instance) {
      XhsSDK.instance = new XhsSDK();
    }
    return XhsSDK.instance;
  }

  /**
   * 检查SDK是否已加载
   * @returns boolean
   */
  public isSDKLoaded(): boolean {
    return this.isLoaded && !!window.xhs;
  }

  /**
   * 动态加载小红书SDK
   * @returns Promise<void>
   */
  public async loadSDK(): Promise<void> {
    // 如果已经加载完成，直接返回
    if (this.isLoaded && window.xhs) {
      return;
    }

    // 如果正在加载，返回加载Promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // 开始加载SDK
    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // 检查是否已经存在script标签
      const existingScript = document.querySelector(
        `script[src="${XHS_SDK_CONFIG.SDK_URL}"]`,
      );

      if (
        existingScript && // 如果script已存在且window.xhs可用，直接resolve
        window.xhs
      ) {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      // 创建script标签
      const script = document.createElement('script');
      script.src = XHS_SDK_CONFIG.SDK_URL;
      script.async = true;
      script.defer = true;

      // 设置加载超时
      const timeout = setTimeout(() => {
        this.isLoading = false;
        reject(new Error('小红书SDK加载超时'));
      }, XHS_SDK_CONFIG.LOAD_TIMEOUT);

      // 加载成功回调
      script.addEventListener('load', () => {
        clearTimeout(timeout);

        // 检查SDK是否正确加载
        if (window.xhs && typeof window.xhs.share === 'function') {
          this.isLoaded = true;
          this.isLoading = false;
          resolve();
        } else {
          this.isLoading = false;
          reject(new Error('小红书SDK加载失败：SDK对象不可用'));
        }
      });

      // // 加载失败回调
      // script.onerror = () => {
      //   clearTimeout(timeout);
      //   this.isLoading = false;
      //   reject(new Error('小红书SDK加载失败：网络错误'));
      // };

      // 添加到页面
      document.head.append(script);
    });

    return this.loadPromise;
  }

  /**
   * 重置SDK状态（用于测试或重新加载）
   */
  public reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * 分享内容到小红书
   * @param config 分享配置
   * @returns Promise<void>
   */
  public async share(config: XhsShareConfig): Promise<void> {
    // 确保SDK已加载
    await this.loadSDK();

    // 验证分享配置
    this.validateShareConfig(config);

    // 调用小红书SDK分享方法
    if (!window.xhs) {
      throw new Error('小红书SDK未正确加载');
    }

    // 包装错误处理
    const shareConfigWithErrorHandler: XhsShareConfig = {
      ...config,
    };

    await window.xhs.share(shareConfigWithErrorHandler);
  }

  /**
   * 验证URL格式
   * @param url URL字符串
   * @returns boolean
   */
  private isValidUrl(url: string): boolean {
    try {
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * 验证分享配置
   * @param config 分享配置
   */
  private validateShareConfig(config: XhsShareConfig): void {
    const { shareInfo, verifyConfig } = config;

    // 验证基本字段
    if (!shareInfo.type) {
      throw new Error('分享类型(type)不能为空');
    }

    if (!['normal', 'video'].includes(shareInfo.type)) {
      throw new Error('分享类型(type)必须是 video 或 normal');
    }

    // 验证图文类型
    if (shareInfo.type === 'normal') {
      if (!shareInfo.images || shareInfo.images.length === 0) {
        throw new Error('图文类型分享必须提供图片');
      }
      // 验证图片URL格式
      shareInfo.images.forEach((url, index) => {
        if (!this.isValidUrl(url)) {
          throw new Error(`第${index + 1}张图片URL格式不正确`);
        }
      });
    }

    // 验证视频类型
    if (shareInfo.type === 'video') {
      if (!shareInfo.video) {
        throw new Error('视频类型分享必须提供视频URL');
      }
      if (!this.isValidUrl(shareInfo.video)) {
        throw new Error('视频URL格式不正确');
      }
      // 验证封面图
      if (shareInfo.cover && !this.isValidUrl(shareInfo.cover)) {
        throw new Error('视频封面URL格式不正确');
      }
    }

    // 验证认证配置
    if (!verifyConfig.appKey) {
      throw new Error('appKey不能为空');
    }
    if (!verifyConfig.nonce) {
      throw new Error('nonce不能为空');
    }
    if (!verifyConfig.timestamp) {
      throw new Error('timestamp不能为空');
    }
    if (!verifyConfig.signature) {
      throw new Error('signature不能为空');
    }
  }
}

// 导出单例实例
export const xhsSDK = XhsSDK.getInstance();
