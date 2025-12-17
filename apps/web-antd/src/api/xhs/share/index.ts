import type { CreateShareResponse, ShareDetail, XhsShareInfo } from 'types/xhs';

import { requestClient as request } from '#/api/request';

export const baseUrl = '/xhs/share';
export const baseName = '小红书分享内容';

// 小红书分享内容 API
export const ShareApi = {
  // 新增分享内容
  create: async (data: XhsShareInfo): Promise<CreateShareResponse> => {
    return await request.post<CreateShareResponse>(`${baseUrl}/create`, data);
  },

  // 根据分享ID获取分享详情
  detail: async (shareId: string): Promise<ShareDetail> => {
    return await request.get<ShareDetail>(`${baseUrl}/detail/${shareId}`);
  },
};
