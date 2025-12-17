/**
 * 小红书SDK配置文件
 */

// 从环境变量获取配置
const getEnvConfig = () => {
  return {
    // 小红书应用Key（从环境变量获取）
    APP_KEY: import.meta.env.VITE_XHS_APP_KEY || '',
    // 小红书SDK地址
    SDK_URL: 'https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js',
    // API基础路径
    API_BASE_PATH: '/api/xhs',
  };
};

// 小红书配置
export const XHS_CONFIG = {
  ...getEnvConfig(),

  // SDK加载配置
  SDK: {
    LOAD_TIMEOUT: 10_000, // SDK加载超时时间（毫秒）
    RETRY_COUNT: 3, // 重试次数
    RETRY_DELAY: 1000, // 重试延迟（毫秒）
  },

  // 分享配置
  SHARE: {
    // 默认分享配置
    DEFAULT_TITLE: '来自我的分享',
    DEFAULT_CONTENT: '快来看看这个有趣的内容！',
    // 图片限制
    MAX_IMAGES: 9, // 最大图片数量
    MIN_IMAGES: 1, // 最小图片数量
    // 内容长度限制
    MAX_TITLE_LENGTH: 20, // 标题最大长度
    MAX_CONTENT_LENGTH: 1000, // 内容最大长度
  },

  // API配置
  API: {
    // 请求超时时间
    TIMEOUT: 30_000,
    // 重试配置
    RETRY_COUNT: 2,
    RETRY_DELAY: 1000,
  },

  // 错误消息配置
  ERROR_MESSAGES: {
    SDK_LOAD_FAILED: '小红书SDK加载失败，请检查网络连接',
    SDK_NOT_AVAILABLE: '小红书SDK不可用，请稍后重试',
    SHARE_FAILED: '分享失败，请重试',
    INVALID_CONFIG: '分享配置不正确',
    NETWORK_ERROR: '网络错误，请检查网络连接',
    AUTH_FAILED: '授权失败，请重新登录',
    SIGNATURE_FAILED: '获取签名失败，请稍后重试',
  },

  // 成功消息配置
  SUCCESS_MESSAGES: {
    SHARE_SUCCESS: '分享成功！',
    SDK_LOADED: '小红书SDK加载成功',
  },
} as const;

// 验证配置
export const validateConfig = () => {
  const errors: string[] = [];

  if (!XHS_CONFIG.APP_KEY) {
    errors.push('VITE_XHS_APP_KEY 环境变量未配置');
  }

  if (!XHS_CONFIG.SDK_URL) {
    errors.push('小红书SDK地址未配置');
  }

  if (errors.length > 0) {
    console.warn('小红书配置警告:', errors);
    return false;
  }

  return true;
};

// 获取当前环境
export const getCurrentEnv = () => {
  return import.meta.env.MODE || 'development';
};

// 是否为开发环境
export const isDevelopment = () => {
  return getCurrentEnv() === 'development';
};

// 是否为生产环境
export const isProduction = () => {
  return getCurrentEnv() === 'production';
};

// 导出类型
export type XhsConfigType = typeof XHS_CONFIG;

// 默认导出
export default XHS_CONFIG;
