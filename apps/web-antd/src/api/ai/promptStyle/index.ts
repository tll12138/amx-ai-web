import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/promptStyle';
export const baseName = 'AI内容风格';
export const HC_TYPE = '横测';
export const ZC_TYPE = '种草';
export const C_TYPE = '评论';

// AI内容风格 API
export const PromptStyleApi = {
  // 查询AI内容风格列表
  getList: async (params: PageQuery) => {
    return await request.get(`/ai/promptStyle/list`, { params });
  },

  // 查询AI内容风格详情
  getDetail: async (id: number | string) => {
    return await request.get(`/ai/promptStyle/${id}`);
  },

  // 新增AI内容风格
  create: async (data: any) => {
    return await request.postWithMsg(`/ai/promptStyle`, data);
  },

  // 修改AI内容风格
  update: async (data: any) => {
    return await request.putWithMsg(`/ai/promptStyle`, data);
  },

  // 删除AI内容风格
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/ai/promptStyle/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/ai/promptStyle/export`, data);
  },

  // 获取AI模型配置下拉框
  options: async (type: string | undefined) => {
    return await request.get(`/ai/promptStyle/options?type=${type}`);
  },
};
