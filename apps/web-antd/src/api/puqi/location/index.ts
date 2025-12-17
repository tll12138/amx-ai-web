import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/puqi/location';
export const baseName = '团建地点信息';

// 团建地点信息 API
export const LocationApi = {
  // 查询团建地点信息列表
  getList: async (params: PageQuery) => {
    return await request.get(`/puqi/location/list`, { params });
  },
  // 查询团建地点信息列表
  getAll: async () => {
    return await request.get(`/puqi/location/all`);
  },

  // 查询团建地点信息详情
  getDetail: async (id: number | string) => {
    return await request.get(`/puqi/location/${id}`);
  },

  // 新增团建地点信息
  create: async (data: any) => {
    return await request.postWithMsg(`/puqi/location`, data);
  },

  // 修改团建地点信息
  update: async (data: any) => {
    return await request.putWithMsg(`/puqi/location`, data);
  },

  // 修改团建地点信息
  updateTime: async (data: any) => {
    return await request.postWithMsg(`/puqi/location/updateTime`, data);
  },

  // 删除团建地点信息
  delete: async (id: IDS) => {
    return await request.deleteWithMsg(`/puqi/location/${id}`);
  },
  // 删除团建地点信息记录
  delRecords: async () => {
    return await request.putWithMsg(`/puqi/location/removeRecords`);
  },

  // 导出商品
  export: async (data: any) => {
    return await commonExport(`/puqi/location/export`, data);
  },
};
