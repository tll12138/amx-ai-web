import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/bitAccount';
export const baseName = '比特账号信息';

// 比特账号信息 API
export const BitAccountApi = {
    // 查询比特账号信息列表
    getList: async (params: PageQuery) => {
        return await request.get(`/rp/bitAccount/list`, { params });
    },

    // 查询比特账号信息详情
    getDetail: async (id: number | string) => {
        return await request.get(`/rp/bitAccount/${id}`);
    },

    // 新增比特账号信息
    create: async (data: any) => {
        return await request.postWithMsg(`/rp/bitAccount`, data);
    },

    // 修改比特账号信息
    update: async (data: any) => {
        return await request.putWithMsg(`/rp/bitAccount`, data);
    },

    // 删除比特账号信息
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/rp/bitAccount/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/rp/bitAccount/export`, data);
    },
};
