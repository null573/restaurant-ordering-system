/** 用户角色 */
export type Role = 'owner' | 'manager' | 'bar' | 'kitchen';
/** 租户状态 */
export type TenantStatus = 'trial' | 'active' | 'expired' | 'suspended';
/** 订单状态 */
export type OrderStatus = 'pending' | 'paid' | 'cooking' | 'served' | 'closed' | 'cancelled';
/** 结账方式 */
export type SettleType = 'self' | 'bar';
/** 支付方式 */
export type PayMethod = 'wechat' | 'cash';
/** 桌位状态 */
export type DeskStatus = 'idle' | 'occupied' | 'paying';
/** 租户(餐厅)信息 */
export interface Tenant {
    id: string;
    name: string;
    code: string;
    contactPhone: string | null;
    wechatAppid: string | null;
    wechatMchid: string | null;
    status: TenantStatus;
    trialStartedAt: string | null;
    trialDays: number;
    planPriceFen: number;
    planCycleDays: number;
    paidUntil: string | null;
    createdAt: string;
}
/** 租户用户 */
export interface TenantUser {
    id: string;
    tenantId: string;
    phone: string;
    name: string | null;
    role: Role;
    createdAt: string;
}
/** 菜品分类 */
export interface Category {
    id: string;
    tenantId: string;
    name: string;
    sortOrder: number;
}
/** 菜品 */
export interface Dish {
    id: string;
    tenantId: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    priceFen: number;
    imageKey: string | null;
    imageUrl: string | null;
    available: boolean;
    stock: number;
    sortOrder: number;
    createdAt: string;
}
/** 桌位 */
export interface Desk {
    id: string;
    tenantId: string;
    number: string;
    name: string | null;
    capacity: number;
    qrToken: string;
    status: DeskStatus;
    createdAt: string;
}
/** 订单 */
export interface Order {
    id: string;
    tenantId: string;
    deskId: string;
    deskNumber: string;
    orderNo: string;
    status: OrderStatus;
    settleType: SettleType | null;
    totalFen: number;
    payMethod: PayMethod | null;
    paidFen: number;
    wechatTradeNo: string | null;
    createdAt: string;
    paidAt: string | null;
    closedAt: string | null;
}
/** 订单明细 */
export interface OrderItem {
    id: string;
    tenantId: string;
    orderId: string;
    dishId: string;
    dishName: string;
    priceFen: number;
    quantity: number;
    remark: string | null;
    status: 'new' | 'cooking' | 'done';
    createdAt: string;
}
/** WebSocket 事件类型 */
export interface WSEvents {
    'order:new': {
        orderId: string;
        deskId: string;
        deskNumber: string;
        items: {
            dishName: string;
            quantity: number;
            remark: string | null;
        }[];
    };
    'order:status': {
        orderId: string;
        status: OrderStatus;
    };
    'desk:status': {
        deskId: string;
        status: DeskStatus;
    };
    'payment:done': {
        orderId: string;
        payMethod: PayMethod;
    };
    'item:status': {
        itemId: string;
        status: 'new' | 'cooking' | 'done';
    };
}
/** API 统一响应 */
export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
}
/** JWT Payload */
export interface JWTPayload {
    tenantId: string;
    userId: string;
    role: Role;
    type: 'access' | 'refresh';
    exp: number;
    iat: number;
}
/** 购物车项 */
export interface CartItem {
    dishId: string;
    name: string;
    priceFen: number;
    quantity: number;
    remark: string;
}
/** 结算单 */
export interface Receipt {
    tenantName: string;
    orderNo: string;
    deskNumber: string;
    items: {
        name: string;
        quantity: number;
        priceFen: number;
        subtotalFen: number;
    }[];
    totalFen: number;
    payMethod: PayMethod | null;
    paidFen: number;
    changeFen: number;
    createdAt: string;
    paidAt: string | null;
}
//# sourceMappingURL=index.d.ts.map