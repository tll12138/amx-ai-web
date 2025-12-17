import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/model';
export const baseName = 'AI模型配置';

// AI模型配置 API
export const ModelApi = {
  // 查询AI模型配置列表
  getList: async (params: PageQuery) => {
    return await request.get(`/ai/model/list`, { params });
  },

  // 查询AI模型配置详情
  getDetail: async (id: number | string) => {
    return await request.get(`/ai/model/${id}`);
  },

  // 新增AI模型配置
  create: async (data: any) => {
    return await request.postWithMsg(`/ai/model`, data);
  },

  // 修改AI模型配置
  update: async (data: any) => {
    return await request.putWithMsg(`/ai/model`, data);
  },

  // 删除AI模型配置
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/ai/model/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/ai/model/export`, data);
  },
  // 获取AI模型配置下拉框
  options: async () => {
    return await request.get(`/ai/model/options`);
  },
  testModel: async (data: any) => {
    return await request.postWithMsg(`/ai/model/test`, data, {
      timeout: 60_000,
    });
  },
};
