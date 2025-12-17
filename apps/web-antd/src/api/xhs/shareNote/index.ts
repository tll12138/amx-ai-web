import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/xhs/shareNote';
export const baseName = '小红书笔记链接分享';

// 小红书笔记链接分享 API
export const ShareNoteApi = {
  // 查询小红书笔记链接分享列表
  getList: async (params: PageQuery) => {
    return await request.get(`/xhs/shareNote/list`, { params });
  },

  // 查询小红书笔记链接分享详情
  getDetail: async (id: number | string) => {
    return await request.get(`/xhs/shareNote/${id}`);
  },

  // 新增小红书笔记链接分享
  create: async (data: any) => {
    return await request.postWithMsg(`/xhs/shareNote`, data);
  },

  // 修改小红书笔记链接分享
  batchUpdate: async () => {
    return await request.getWithMsg(`/xhs/shareNote/batchUpdate`);
  },

  // 删除小红书笔记链接分享
  updateByNoteId: async (id: string) => {
    return await request.getWithMsg(`/xhs/shareNote/updateInteraction/${id}`);
  },

  // 删除小红书笔记链接分享
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/xhs/shareNote/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/xhs/shareNote/export`, data);
  },
};
