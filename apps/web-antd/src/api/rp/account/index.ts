import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/account';
export const baseName = '账号信息';

// 账号信息 API
export const AccountApi = {
  // 查询账号信息列表
  getList: async (params: PageQuery) => {
    return await request.get(`/rp/account/list`, { params });
  },

  // 查询账号信息详情
  getDetail: async (id: number | string) => {
    return await request.get(`/rp/account/${id}`);
  },

  // 新增账号信息
  create: async (data: any) => {
    return await request.postWithMsg(`/rp/account`, data);
  },

  // 修改账号信息
  update: async (data: any) => {
    return await request.putWithMsg(`/rp/account`, data);
  },

  // 删除账号信息
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/rp/account/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/rp/account/export`, data);
  },
};
