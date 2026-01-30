import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/accountConfig';
export const baseName = 'RPA账号配置';

// RPA账号配置 API
export const AccountConfigApi = {
    // 查询RPA账号配置列表
    getList: async (params: PageQuery) => {
        return await request.get(`/rp/accountConfig/list`, { params });
    },

    // 查询RPA账号配置详情
    getDetail: async (id: number | string) => {
        return await request.get(`/rp/accountConfig/${id}`);
    },

    // 新增RPA账号配置
    create: async (data: any) => {
        return await request.postWithMsg(`/rp/accountConfig`, data);
    },

    // 修改RPA账号配置
    update: async (data: any) => {
        return await request.putWithMsg(`/rp/accountConfig`, data);
    },

    // 删除RPA账号配置
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/rp/accountConfig/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/rp/accountConfig/export`, data);
    },
};
