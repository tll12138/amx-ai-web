import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/commentTask';
export const baseName = 'AI评论生成';

// AI评论生成 API
export const CommentTaskApi = {
  // 查询AI评论生成列表
  getList: async (params: PageQuery) => {
    return await request.get(`/ai/commentTask/list`, { params });
  },

  // 查询AI评论生成详情
  getDetail: async (id: number | string) => {
    return await request.get(`/ai/commentTask/${id}`);
  },

  // 新增AI评论生成
  create: async (data: any) => {
    return await request.postWithMsg(`/ai/commentTask`, data);
  },

  // 修改AI评论生成
  update: async (data: any) => {
    return await request.putWithMsg(`/ai/commentTask`, data);
  },

  // 删除AI评论生成
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/ai/commentTask/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/ai/commentTask/export`, data);
  },
};
