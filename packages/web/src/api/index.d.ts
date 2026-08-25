import { type AxiosInstance } from 'axios';
declare const api: AxiosInstance;
export default api;
export declare const authApi: {
    register: (data: {
        name: string;
        contactPhone: string;
        password: string;
        managerName?: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        name: string;
        contactPhone: string;
        password: string;
        managerName?: string;
    }, {}, any>>;
    login: (data: {
        phone: string;
        password: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        phone: string;
        password: string;
    }, {}, any>>;
    refresh: (data: {
        refreshToken: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        refreshToken: string;
    }, {}, any>>;
    getUsers: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    addUser: (data: {
        phone: string;
        password: string;
        name: string;
        role: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        phone: string;
        password: string;
        name: string;
        role: string;
    }, {}, any>>;
    deleteUser: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
};
export declare const menuApi: {
    getCategories: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    addCategory: (data: {
        name: string;
        sortOrder?: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        name: string;
        sortOrder?: number;
    }, {}, any>>;
    updateCategory: (id: string, data: {
        name?: string;
        sortOrder?: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        name?: string;
        sortOrder?: number;
    }, {}, any>>;
    deleteCategory: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    getDishes: (params?: {
        categoryId?: string;
        available?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}, {
        categoryId?: string;
        available?: string;
    }>>;
    addDish: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    updateDish: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    deleteDish: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    uploadImage: (dishId: string, file: File) => Promise<import("axios").AxiosResponse<any, FormData, {}, any>>;
};
export declare const deskApi: {
    list: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    add: (data: {
        number: string;
        name?: string;
        capacity?: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        number: string;
        name?: string;
        capacity?: number;
    }, {}, any>>;
    update: (id: string, data: {
        number?: string;
        name?: string;
        capacity?: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        number?: string;
        name?: string;
        capacity?: number;
    }, {}, any>>;
    remove: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    batch: (data: {
        prefix: string;
        start: number;
        count: number;
        capacity?: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        prefix: string;
        start: number;
        count: number;
        capacity?: number;
    }, {}, any>>;
    getQRCode: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    getAllQRCodes: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    getStatus: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
};
export declare const orderApi: {
    list: (params?: {
        status?: string;
        deskId?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}, {
        status?: string;
        deskId?: string;
    }>>;
    detail: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    updateStatus: (id: string, status: string) => Promise<import("axios").AxiosResponse<any, {
        status: string;
    }, {}, any>>;
    updateItemStatus: (orderId: string, itemId: string, status: string) => Promise<import("axios").AxiosResponse<any, {
        status: string;
    }, {}, any>>;
    barCash: (data: {
        orderId: string;
        paidFen: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        orderId: string;
        paidFen: number;
    }, {}, any>>;
    receipt: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
};
export declare const customerApi: {
    getMenu: (qrToken: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    submitOrder: (qrToken: string, data: {
        items: any[];
        remark?: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        items: any[];
        remark?: string;
    }, {}, any>>;
    getOrder: (qrToken: string) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
};
export declare const subscriptionApi: {
    status: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    pay: (data: {
        cycleDays?: number;
    }) => Promise<import("axios").AxiosResponse<any, {
        cycleDays?: number;
    }, {}, any>>;
    getSettings: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    updateSettings: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
    getPayments: () => Promise<import("axios").AxiosResponse<any, any, {}, any>>;
};
export declare const paymentApi: {
    jsapi: (data: {
        orderId: string;
        openid: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        orderId: string;
        openid: string;
    }, {}, any>>;
    h5: (data: {
        orderId: string;
    }) => Promise<import("axios").AxiosResponse<any, {
        orderId: string;
    }, {}, any>>;
};
//# sourceMappingURL=index.d.ts.map