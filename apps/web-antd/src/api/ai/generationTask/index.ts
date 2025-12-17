import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/ai/generationTask';
export const baseName = 'AI生成任务';

// AI生成任务 API
export const GenerationTaskApi = {
  // 查询AI生成任务列表
  getList: async (params: PageQuery) => {
    return await request.get(`/ai/generationTask/list`, { params });
  },

  // 查询AI生成任务列表
  getAll: async () => {
    return await request.get(`/ai/generationTask/all`);
  },

  // 查询AI生成任务的竞品信息
  getCompetitors: async (id: string) => {
    return await request.get(`/ai/generationTask/competitors?id=${id}`);
  },

  // 查询AI生成任务详情
  getDetail: async (id: number | string) => {
    return await request.get(`/ai/generationTask/${id}`);
  },

  // 新增AI生成任务
  create: async (data: any) => {
    return await request.post(`/ai/generationTask`, data);
  },

  // 新增AI生成任务
  modify: async (data: any) => {
    return await request.post(`/ai/generationTask/modifyContent`, data, {
      timeout: 30_000,
    });
  },

  // 修改AI生成任务
  update: async (data: any) => {
    return await request.putWithMsg(`/ai/generationTask`, data);
  },
  // 修改AI生成任务
  updateParagraph: async (data: any) => {
    return await request.put(`/ai/generationTask/updateParagraph`, data);
  },

  // 删除AI生成任务
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/ai/generationTask/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/ai/generationTask/export`, data);
  },
};
