import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { deskApi } from '../../api';
import { useWebSocket } from '../../composables/useWebSocket';
import { fenToYuan } from '../../utils/qrcode';
import { PullRefresh as VanPullRefresh, Empty as VanEmpty, Loading as VanLoading, showToast } from 'vant';
const router = useRouter();
// 从 localStorage 获取 userInfo.tenantId
function readTenantId() {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}').tenantId || '';
    }
    catch {
        return '';
    }
}
const tenantId = readTenantId();
const desks = ref([]);
const refreshing = ref(false);
const firstLoaded = ref(false);
// 获取所有桌位状态
// 响应拦截器已返回 { code, message, data }，故 res.data 即桌位数组
async function fetchStatus() {
    try {
        const res = await deskApi.getStatus();
        desks.value = res.data || [];
    }
    catch {
        // 网络错误时保留上次数据，不打断轮询
    }
    finally {
        firstLoaded.value = true;
        refreshing.value = false;
    }
}
function statusClass(status) {
    if (status === 'occupied')
        return 'status-occupied';
    if (status === 'paying')
        return 'status-paying';
    return 'status-idle';
}
function statusText(status) {
    if (status === 'occupied')
        return '有顾客';
    if (status === 'paying')
        return '结账中';
    return '空闲';
}
function onDeskClick(desk) {
    if (desk.status === 'idle') {
        showToast('空桌');
    }
    else {
        // 有顾客 / 结账中 -> 跳转结算（传递 deskId，页面内查找活跃订单）
        router.push(`/bar/settlement/${desk.id}`);
    }
}
function onRefresh() {
    refreshing.value = true;
    fetchStatus();
}
// ===== 实时刷新 =====
// 为避免为每个桌位建立过多 WS 连接，使用单一租户级 WS 推送通道 + 5 秒轮询。
// 轮询为可靠的主刷新机制；WS 事件到达时立即触发刷新。
let pollTimer = null;
const { messages, connect, disconnect } = useWebSocket(tenantId, 'all', 'bar');
watch(() => messages.value.length, () => {
    const latest = messages.value[messages.value.length - 1];
    if (!latest)
        return;
    if (['order:new', 'order:status', 'desk:status', 'payment:done'].includes(latest.type)) {
        fetchStatus();
    }
});
onMounted(() => {
    fetchStatus();
    // 仅在已登录（有 tenantId）时建立 WS 推送通道
    if (tenantId)
        connect();
    pollTimer = window.setInterval(fetchStatus, 5000);
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
/** @type {__VLS_StyleScopedClasses['desk-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-view page" },
});
const __VLS_0 = {}.VanPullRefresh;
/** @type {[typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onRefresh: (__VLS_ctx.onRefresh)
};
__VLS_3.slots.default;
if (!__VLS_ctx.firstLoaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-box" },
    });
    const __VLS_8 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    var __VLS_11;
}
else if (__VLS_ctx.desks.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "desk-grid" },
    });
    for (const [desk] of __VLS_getVForSourceType((__VLS_ctx.desks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.firstLoaded))
                        return;
                    if (!(__VLS_ctx.desks.length))
                        return;
                    __VLS_ctx.onDeskClick(desk);
                } },
            key: (desk.id),
            ...{ class: "desk-card" },
            ...{ class: (__VLS_ctx.statusClass(desk.status)) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "desk-no" },
        });
        (desk.name || ('桌号 ' + desk.number));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "desk-status" },
        });
        (__VLS_ctx.statusText(desk.status));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-cap" },
        });
        (desk.capacity);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (desk.active_orders);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "desk-amount" },
        });
        (__VLS_ctx.fenToYuan(desk.total_fen));
    }
}
else {
    const __VLS_12 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        description: "暂无桌位，请先在「管理 - 桌位管理」中添加",
    }));
    const __VLS_14 = __VLS_13({
        description: "暂无桌位，请先在「管理 - 桌位管理」中添加",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['table-view']} */ ;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-box']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-card']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-head']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-no']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-status']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-cap']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-amount']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            fenToYuan: fenToYuan,
            VanPullRefresh: VanPullRefresh,
            VanEmpty: VanEmpty,
            VanLoading: VanLoading,
            desks: desks,
            refreshing: refreshing,
            firstLoaded: firstLoaded,
            statusClass: statusClass,
            statusText: statusText,
            onDeskClick: onDeskClick,
            onRefresh: onRefresh,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=TableView.vue.js.map