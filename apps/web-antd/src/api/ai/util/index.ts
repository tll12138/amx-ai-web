import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/util';

// 工具 API
export const UtilApi = {
  // 处理红书链接
  handleXhsUrl: async (data: any) => {
    return request.post(`/ai/util/parseXhs`, data);
  },
};
