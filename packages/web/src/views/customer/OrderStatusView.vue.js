import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Steps as VanSteps, Step as VanStep, Button as VanButton, Icon as VanIcon, Tag as VanTag, Empty as VanEmpty, Loading as VanLoading, showFailToast, } from 'vant';
import { customerApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';
import { useWebSocket } from '../../composables/useWebSocket';
const route = useRoute();
const router = useRouter();
const qrToken = route.params.qrToken;
const order = ref(null);
const loading = ref(true);
// WebSocket 所需的 tenantId / deskId（从 getOrder 返回数据获取，异步设置）
const wsTenantId = ref('');
const wsDeskId = ref('');
const { connected, messages, connect, disconnect } = useWebSocket(wsTenantId, wsDeskId, 'customer');
// 状态步进: pending=待接单 paid=已接单 cooking=制作中 served=已完成
const statusSteps = ['pending', 'paid', 'cooking', 'served'];
const currentStep = computed(() => {
    if (!order.value)
        return 0;
    const idx = statusSteps.indexOf(order.value.status);
    return idx >= 0 ? idx : 0;
});
const statusTip = computed(() => {
    switch (order.value?.status) {
        case 'pending':
            return '订单已提交，等待吧台接单...';
        case 'paid':
            return '已接单，即将开始制作';
        case 'cooking':
            return '后厨正在加紧制作中，请耐心等待';
        case 'served':
            return '订单已完成，祝您用餐愉快！';
        default:
            return '';
    }
});
const settleLabel = computed(() => {
    if (order.value?.settleType === 'self')
        return '自助支付';
    if (order.value?.settleType === 'bar')
        return '吧台结账';
    return '待结账';
});
function itemStatusTag(status) {
    switch (status) {
        case 'new':
            return '待制作';
        case 'cooking':
            return '制作中';
        case 'done':
            return '已完成';
        default:
            return '';
    }
}
function itemStatusColor(status) {
    switch (status) {
        case 'new':
            return 'var(--text-secondary)';
        case 'cooking':
            return 'var(--primary)';
        case 'done':
            return 'var(--success)';
        default:
            return 'var(--text-secondary)';
    }
}
function formatTime(iso) {
    try {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    catch {
        return '';
    }
}
function goMenu() {
    router.replace(`/c/${qrToken}`);
}
async function fetchOrder() {
    try {
        const res = await customerApi.getOrder(qrToken);
        const data = res.data;
        if (!data) {
            order.value = null;
            return;
        }
        order.value = {
            id: data.id,
            tenantId: data.tenantId,
            deskId: data.deskId,
            orderNo: data.orderNo,
            status: data.status,
            totalFen: data.totalFen,
            settleType: data.settleType,
            payMethod: data.payMethod,
            createdAt: data.createdAt,
            items: (data.items || []).map((i) => ({
                id: i.id,
                dishId: i.dishId,
                dishName: i.dishName,
                priceFen: i.priceFen,
                quantity: i.quantity,
                remark: i.remark,
                status: i.status,
            })),
        };
        // 设置 WebSocket 连接参数
        wsTenantId.value = order.value.tenantId;
        wsDeskId.value = order.value.deskId;
    }
    catch (err) {
        showFailToast(err?.response?.data?.message || err?.message || '查询订单失败');
    }
    finally {
        loading.value = false;
    }
}
// WebSocket 实时更新：监听 order:status / payment:done 事件
watch(() => messages.value.length, () => {
    const latest = messages.value[messages.value.length - 1];
    if (!latest || !order.value)
        return;
    if (latest.type === 'order:status' && latest.orderId === order.value.id) {
        order.value.status = latest.status;
        // 状态推进时也可同步刷新明细
        fetchOrder();
    }
    else if (latest.type === 'payment:done' &&
        latest.orderId === order.value.id) {
        fetchOrder();
    }
});
// 轮询兜底：每 8 秒刷新一次，防止 WS 偶发断连导致状态停滞
let pollTimer = null;
onMounted(async () => {
    await fetchOrder();
    // 仅在拿到订单且参数齐全时建立 WS 连接
    if (order.value && wsTenantId.value && wsDeskId.value) {
        connect();
    }
    pollTimer = window.setInterval(fetchOrder, 8000);
});
onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    disconnect();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['item-list']} */ ;
/** @type {__VLS_StyleScopedClasses['order-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page status-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onClick: (__VLS_ctx.goMenu) },
    ...{ class: "back-btn" },
});
const __VLS_0 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    name: "arrow-left",
    size: "18",
}));
const __VLS_2 = __VLS_1({
    name: "arrow-left",
    size: "18",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "header-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "header-placeholder" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-box" },
    });
    const __VLS_4 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
    const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    var __VLS_7;
}
else if (!__VLS_ctx.order) {
    const __VLS_8 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        description: "当前桌位暂无进行中的订单",
    }));
    const __VLS_10 = __VLS_9({
        description: "当前桌位暂无进行中的订单",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    const __VLS_12 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        ...{ 'onClick': {} },
        ...{ class: "btn-gradient empty-btn" },
    }));
    const __VLS_14 = __VLS_13({
        ...{ 'onClick': {} },
        ...{ class: "btn-gradient empty-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_16;
    let __VLS_17;
    let __VLS_18;
    const __VLS_19 = {
        onClick: (__VLS_ctx.goMenu)
    };
    __VLS_15.slots.default;
    var __VLS_15;
    var __VLS_11;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section card steps-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "order-no" },
    });
    (__VLS_ctx.order.orderNo);
    const __VLS_20 = {}.VanSteps;
    /** @type {[typeof __VLS_components.VanSteps, typeof __VLS_components.vanSteps, typeof __VLS_components.VanSteps, typeof __VLS_components.vanSteps, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        active: (__VLS_ctx.currentStep),
        activeColor: "var(--primary)",
    }));
    const __VLS_22 = __VLS_21({
        active: (__VLS_ctx.currentStep),
        activeColor: "var(--primary)",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    const __VLS_24 = {}.VanStep;
    /** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({}));
    const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    var __VLS_27;
    const __VLS_28 = {}.VanStep;
    /** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
    const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    var __VLS_31;
    const __VLS_32 = {}.VanStep;
    /** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
    const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    var __VLS_35;
    const __VLS_36 = {}.VanStep;
    /** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    var __VLS_39;
    var __VLS_23;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "status-tip text-sm text-secondary" },
    });
    (__VLS_ctx.statusTip);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "item-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.order.items))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (item.id),
            ...{ class: "order-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "oi-name" },
        });
        (item.dishName);
        if (__VLS_ctx.itemStatusTag(item.status)) {
            const __VLS_40 = {}.VanTag;
            /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
            // @ts-ignore
            const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
                plain: true,
                size: "medium",
                color: (__VLS_ctx.itemStatusColor(item.status)),
                ...{ class: "item-tag" },
            }));
            const __VLS_42 = __VLS_41({
                plain: true,
                size: "medium",
                color: (__VLS_ctx.itemStatusColor(item.status)),
                ...{ class: "item-tag" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            __VLS_43.slots.default;
            (__VLS_ctx.itemStatusTag(item.status));
            var __VLS_43;
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "oi-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "oi-qty" },
        });
        (__VLS_ctx.fenToYuan(item.priceFen));
        (item.quantity);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "oi-sub" },
        });
        (__VLS_ctx.fenToYuan(item.priceFen * item.quantity));
        if (item.remark) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-sm text-secondary oi-remark" },
            });
            (item.remark);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section card amount-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "amount-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "total-amount" },
    });
    (__VLS_ctx.fenToYuan(__VLS_ctx.order.totalFen));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-row text-sm text-secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.settleLabel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.formatTime(__VLS_ctx.order.createdAt));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "actions" },
    });
    const __VLS_44 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        ...{ class: "btn-gradient action-btn" },
        block: true,
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        ...{ class: "btn-gradient action-btn" },
        block: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (__VLS_ctx.goMenu)
    };
    __VLS_47.slots.default;
    var __VLS_47;
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['status-page']} */ ;
/** @type {__VLS_StyleScopedClasses['status-header']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['header-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-box']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['steps-card']} */ ;
/** @type {__VLS_StyleScopedClasses['order-no']} */ ;
/** @type {__VLS_StyleScopedClasses['status-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['item-list']} */ ;
/** @type {__VLS_StyleScopedClasses['order-item']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-qty']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-remark']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['amount-card']} */ ;
/** @type {__VLS_StyleScopedClasses['amount-row']} */ ;
/** @type {__VLS_StyleScopedClasses['total-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanSteps: VanSteps,
            VanStep: VanStep,
            VanButton: VanButton,
            VanIcon: VanIcon,
            VanTag: VanTag,
            VanEmpty: VanEmpty,
            VanLoading: VanLoading,
            fenToYuan: fenToYuan,
            order: order,
            loading: loading,
            currentStep: currentStep,
            statusTip: statusTip,
            settleLabel: settleLabel,
            itemStatusTag: itemStatusTag,
            itemStatusColor: itemStatusColor,
            formatTime: formatTime,
            goMenu: goMenu,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=OrderStatusView.vue.js.map