/**
 * 小红书SDK相关类型定义
 */

// 笔记类型
export type XhsNoteType = 'normal' | 'video';

// 分享信息接口
export interface XhsShareInfo {
  /** 必填，笔记类型 'video' | 'normal' */
  type: XhsNoteType;
  /** 笔记标题 */
  title?: string;
  /** 笔记正文 */
  content?: string;
  /** 图文类型必填，笔记图片，必须是服务器地址，暂时不支持本地文件 */
  images?: string[];
  /** 视频类型必填，必须是服务器地址 */
  video?: string;
  /** 视频封面图，必须是服务器地址，暂时不支持本地文件 */
  cover?: string;
}

// 组件属性定义
export interface XhsSharePreviewProps {
  /** 分享信息 */
  shareInfo?: Partial<XhsShareInfo>;
  /** 用户头像 */
  userAvatar?: string;
  /** 用户昵称 */
  userName?: string;
  /** 是否显示发布按钮 */
  showPublish?: boolean;
  /** 是否显示分享按钮 */
  showShareButton?: boolean;
}

// 验证配置接口
export interface XhsVerifyConfig {
  /** 必填，应用的唯一标识 */
  appKey: string;
  /** 必填，服务端生成签名的随机字符串 */
  nonce: string;
  /** 必填，服务端生成签名的时间戳 */
  timestamp: string;
  /** 必填，服务端生成的签名 */
  signature: string;
}

// 完整的分享配置接口
export interface XhsShareConfig {
  shareInfo: XhsShareInfo;
  verifyConfig: XhsVerifyConfig;
  /** 调用失败时执行的回调函数 */
  fail?: (error: any) => void;
}

// 获取access_token的请求参数
export interface XhsTokenRequest {
  app_key: string;
  nonce: string;
  timestamp: number;
  signature: string;
  expires_in?: number;
}

// 获取access_token的响应
export interface XhsTokenResponse {
  access_token: string;
  expires_in: number;
}

// 获取分享签名的请求参数
export interface XhsSignatureRequest {
  appKey: string;
  nonce: string;
  timestamp: string;
}

// 获取分享签名的响应
export interface XhsSignatureResponse {
  appKey: string;
  nonce: string;
  timestamp: string;
  signature: string;
}

// 小红书SDK全局对象类型
export interface XhsSDKGlobal {
  share: (config: XhsShareConfig) => Promise<void>;
}

// 扩展Window接口
declare global {
  interface Window {
    xhs?: XhsSDKGlobal;
  }
}

// 创建分享响应
export interface CreateShareResponse {
  /** 分享ID */
  shareId: string;
  /** 分享链接 */
  shareUrl: string;
  /** 过期时间 */
  expiresAt: string;
  /** 创建时间 */
  createTime: string;
}

export interface ShareDetail extends XhsShareInfo {
  /** 分享链接 */
  shareUrl: string;
  /** 分享状态 */
  status: number;
  /** 过期时间 */
  expiresAt: Date;
  /** 创建时间 */
  createTime: Date;
}
export {};
