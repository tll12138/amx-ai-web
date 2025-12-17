/**
 * 设备检测工具
 * 用于检测用户设备类型和浏览器环境
 */

/**
 * 设备类型枚举
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

/**
 * 浏览器类型枚举
 */
export enum BrowserType {
  CHROME = 'chrome',
  EDGE = 'edge',
  FIREFOX = 'firefox',
  IE = 'ie',
  OPERA = 'opera',
  QQ = 'qq',
  SAFARI = 'safari',
  UNKNOWN = 'unknown',
  WECHAT = 'wechat',
}

/**
 * 操作系统类型枚举
 */
export enum OSType {
  ANDROID = 'android',
  IOS = 'ios',
  LINUX = 'linux',
  MACOS = 'macos',
  UNKNOWN = 'unknown',
  WINDOWS = 'windows',
}

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  type: DeviceType;
  browser: BrowserType;
  os: OSType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWechat: boolean;
  isQQ: boolean;
  supportsTouchEvents: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

/**
 * 检测是否为移动设备
 * @returns 是否为移动设备
 */
export function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // 检测移动设备关键词
  const mobileKeywords = [
    'mobile',
    'android',
    'iphone',
    'ipod',
    'blackberry',
    'windows phone',
    'opera mini',
    'iemobile',
  ];

  // 检查用户代理字符串
  const isMobileUA = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword),
  );

  // 检查屏幕尺寸
  const isMobileScreen = window.innerWidth <= 768;

  // 检查触摸事件支持
  const supportsTouchEvents =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isMobileUA || (isMobileScreen && supportsTouchEvents);
}

/**
 * 检测是否为平板设备
 * @returns 是否为平板设备
 */
export function detectTabletDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // iPad 检测
  const isIPad =
    userAgent.includes('ipad') ||
    (userAgent.includes('macintosh') && navigator.maxTouchPoints > 1);

  // Android 平板检测
  const isAndroidTablet =
    userAgent.includes('android') && !userAgent.includes('mobile');

  // 屏幕尺寸检测（平板通常在 768px - 1024px 之间）
  const isTabletScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;

  return isIPad || isAndroidTablet || isTabletScreen;
}

/**
 * 检测浏览器类型
 * @returns 浏览器类型
 */
export function detectBrowserType(): BrowserType {
  if (typeof window === 'undefined') {
    return BrowserType.UNKNOWN;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // 微信浏览器
  if (userAgent.includes('micromessenger')) {
    return BrowserType.WECHAT;
  }

  // QQ浏览器
  if (userAgent.includes('qq/') || userAgent.includes('qqbrowser')) {
    return BrowserType.QQ;
  }

  // Chrome
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return BrowserType.CHROME;
  }

  // Edge
  if (userAgent.includes('edg')) {
    return BrowserType.EDGE;
  }

  // Firefox
  if (userAgent.includes('firefox')) {
    return BrowserType.FIREFOX;
  }

  // Safari
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return BrowserType.SAFARI;
  }

  // Opera
  if (userAgent.includes('opera') || userAgent.includes('opr/')) {
    return BrowserType.OPERA;
  }

  // IE
  if (userAgent.includes('trident') || userAgent.includes('msie')) {
    return BrowserType.IE;
  }

  return BrowserType.UNKNOWN;
}

/**
 * 检测操作系统类型
 * @returns 操作系统类型
 */
export function detectOSType(): OSType {
  if (typeof window === 'undefined') {
    return OSType.UNKNOWN;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // iOS
  if (
    userAgent.includes('iphone') ||
    userAgent.includes('ipad') ||
    userAgent.includes('ipod')
  ) {
    return OSType.IOS;
  }

  // macOS (需要在 iOS 检测之后)
  if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
    return OSType.MACOS;
  }

  // Android
  if (userAgent.includes('android')) {
    return OSType.ANDROID;
  }

  // Windows
  if (userAgent.includes('windows')) {
    return OSType.WINDOWS;
  }

  // Linux
  if (userAgent.includes('linux')) {
    return OSType.LINUX;
  }

  return OSType.UNKNOWN;
}

/**
 * 检测是否支持触摸事件
 * @returns 是否支持触摸事件
 */
export function detectTouchSupport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 检测是否为微信浏览器
 * @returns 是否为微信浏览器
 */
export function detectWechatBrowser(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return navigator.userAgent.toLowerCase().includes('micromessenger');
}

/**
 * 检测是否为QQ浏览器
 * @returns 是否为QQ浏览器
 */
export function detectQQBrowser(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('qq/') || userAgent.includes('qqbrowser');
}

/**
 * 获取完整的设备信息
 * @returns 设备信息对象
 */
export function getDeviceInfo(): DeviceInfo {
  const isMobile = detectMobileDevice();
  const isTablet = detectTabletDevice();
  const isDesktop = !isMobile && !isTablet;
  const browser = detectBrowserType();
  const os = detectOSType();
  const supportsTouchEvents = detectTouchSupport();
  const isWechat = detectWechatBrowser();
  const isQQ = detectQQBrowser();

  let type: DeviceType;
  if (isMobile) {
    type = DeviceType.MOBILE;
  } else if (isTablet) {
    type = DeviceType.TABLET;
  } else {
    type = DeviceType.DESKTOP;
  }

  return {
    type,
    browser,
    os,
    isMobile,
    isTablet,
    isDesktop,
    isIOS: os === OSType.IOS,
    isAndroid: os === OSType.ANDROID,
    isWechat,
    isQQ,
    supportsTouchEvents,
    screenWidth: typeof window === 'undefined' ? 0 : window.innerWidth,
    screenHeight: typeof window === 'undefined' ? 0 : window.innerHeight,
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  };
}

/**
 * 检测是否为小红书应用内浏览器
 * @returns 是否为小红书应用内浏览器
 */
export function detectXhsApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('xhsminiprogram') || userAgent.includes('redbook');
}

/**
 * 检测是否支持小红书分享
 * @returns 是否支持小红书分享
 */
export function detectXhsShareSupport(): boolean {
  // 检测是否在小红书应用内
  if (detectXhsApp()) {
    return true;
  }

  // 检测是否为移动设备（移动设备可以通过URL Scheme调用小红书）
  if (detectMobileDevice()) {
    return true;
  }

  return false;
}

/**
 * 获取推荐的分享方式
 * @returns 推荐的分享方式描述
 */
export function getRecommendedShareMethod(): string {
  const deviceInfo = getDeviceInfo();

  if (detectXhsApp()) {
    return '直接分享到小红书';
  }

  if (deviceInfo.isMobile) {
    if (deviceInfo.isIOS) {
      return '通过Safari浏览器打开小红书应用';
    } else if (deviceInfo.isAndroid) {
      return '通过浏览器打开小红书应用';
    }
    return '通过手机浏览器分享';
  }

  return '请在手机上打开此页面进行分享';
}
