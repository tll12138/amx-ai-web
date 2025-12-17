/**
 * 小红书API接口定义
 */

import type {
  XhsSignatureRequest,
  XhsSignatureResponse,
  XhsTokenRequest,
  XhsTokenResponse,
} from 'types/xhs';

import { requestClient as request } from '#/api/request';

// API路径常量
const API_PATHS = {
  GET_ACCESS_TOKEN: '/xhs/auth/token',
  REFRESH_ACCESS_TOKEN: '/xhs/auth/refresh',
  GET_SHARE_SIGNATURE: '/xhs/share/signature',
} as const;

/**
 * 生成随机字符串（用于nonce）
 * @param length 字符串长度，默认16
 * @returns string
 */
function generateNonce(length: number = 16): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成时间戳字符串
 * @returns string
 */
function generateTimestamp(): string {
  return Math.floor(Date.now()).toString();
}
/**
 * 小红书API服务类
 */
export const XhsApiService = {
  /**
   * 获取小红书access_token
   * @param params 请求参数
   * @returns Promise<XhsTokenResponse>
   */
  async getAccessToken(
    params: Omit<XhsTokenRequest, 'app_key' | 'signature'>,
  ): Promise<XhsTokenResponse> {
    try {
      const response = await request.post<XhsTokenResponse>(
        API_PATHS.GET_ACCESS_TOKEN,
        params,
      );
      return response;
    } catch (error) {
      console.error('获取小红书access_token失败:', error);
      throw new Error('获取授权令牌失败，请稍后重试');
    }
  },

  /**
   * 获取小红书分享签名
   * @param params 请求参数
   * @returns Promise<XhsSignatureResponse>
   */
  async getShareSignature(
    params: XhsSignatureRequest,
  ): Promise<XhsSignatureResponse> {
    try {
      const response = await request.post<XhsSignatureResponse>(
        API_PATHS.GET_SHARE_SIGNATURE,
        params,
      );
      return response;
    } catch (error) {
      console.error('获取小红书分享签名失败:', error);
      throw new Error('获取分享签名失败，请稍后重试');
    }
  },

  /**
   * 刷新access_token
   * @returns Promise<void>
   */
  refresh: async (): Promise<void> => {
    await request.get<void>(API_PATHS.REFRESH_ACCESS_TOKEN);
  },
};

/**
 * 获取完整的分享验证配置
 * 这个方法会自动生成nonce和timestamp，并调用后端获取签名
 * @param appKey 应用Key
 * @returns Promise<XhsSignatureResponse>
 */
async function getCompleteVerifyConfig(
  appKey: string,
): Promise<XhsSignatureResponse> {
  const nonce = generateNonce();
  const timestamp = generateTimestamp();

  const params: XhsSignatureRequest = {
    appKey,
    nonce,
    timestamp,
  };
  return await XhsApiService.getShareSignature(params);
}

export { getCompleteVerifyConfig };
