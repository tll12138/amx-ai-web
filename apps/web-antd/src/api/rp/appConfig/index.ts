import type { IDS, PageQuery } from '#/api/common';

import { commonExport } from '#/api/helper';
import { requestClient as request } from '#/api/request';

export const baseUrl = '/rp/appConfig';
export const baseName = '影刀应用配置';

// 影刀应用配置 API
export const AppConfigApi = {
    // 查询影刀应用配置列表
    getList: async (params: PageQuery) => {
        return await request.get(`/rp/appConfig/list`, { params });
    },

    // 查询影刀应用配置详情
    getDetail: async (id: number | string) => {
        return await request.get(`/rp/appConfig/${id}`);
    },

    // 新增影刀应用配置
    create: async (data: any) => {
        return await request.postWithMsg(`/rp/appConfig`, data);
    },

    // 修改影刀应用配置
    update: async (data: any) => {
        return await request.putWithMsg(`/rp/appConfig`, data);
    },

    // 删除影刀应用配置
    delete: async (id: IDS) => {
        return await request.deleteWithMsg(`/rp/appConfig/${id}`);
    },

    // 导出商品
    export: async (data: any) => {
        return await commonExport(`/rp/appConfig/export`, data);
    },
};
