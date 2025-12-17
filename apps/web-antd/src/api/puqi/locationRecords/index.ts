import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/puqi/locationRecords';
export const baseName = '预约记录';

// 预约记录 API
export const LocationRecordsApi = {
  // 查询预约记录列表
  getList: async (params: PageQuery) => {
    return await request.get(`/puqi/locationRecords/list`, { params });
  },

  // 获取当前用户是否已预约
  isBooked: async () => {
    return await request.get(`/puqi/locationRecords/isBooked`);
  },

  // 查询预约记录详情
  getDetail: async () => {
    return await request.get(`/puqi/locationRecords`, {
      errorMessageMode: 'none',
    });
  },

  // 新增预约记录
  create: async (data: any) => {
    return await request.post(`/puqi/locationRecords`, data, {
      errorMessageMode: 'none',
      timeout: 20 * 1000,
      encrypt: true,
    });
  },

  // 修改预约记录
  update: async (data: any) => {
    return await request.putWithMsg(`/puqi/locationRecords`, data);
  },

  // 删除预约记录
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/puqi/locationRecords/${id}`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/puqi/locationRecords/export`, data);
  },
};
