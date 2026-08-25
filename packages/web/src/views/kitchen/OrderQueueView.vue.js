import { ref, onMounted, onUnmounted } from 'vue';
import { orderApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';
import { PullRefresh as VanPullRefresh, Empty as VanEmpty, Button as VanButton, Tag as VanTag, Loading as VanLoading, showToast, } from 'vant';
// pending / cooking 列表均附带 items（来自订单详情）
const pending = ref([]);
const cooking = ref([]);
const loading = ref(true);
const refreshing = ref(false);
// 全部菜品已完成
function allDone(order) {
    const items = order.items || [];
    return items.length > 0 && items.every((i) => i.status === 'done');
}
// 拉取订单（列表 + 各订单详情）
async function fetchOrders(silent = false) {
    if (!silent)
        loading.value = true;
    try {
        const [pendRes, cookRes] = await Promise.all([
            orderApi.list({ status: 'pending' }),
            orderApi.list({ status: 'cooking' }),
        ]);
        const pendList = pendRes.data || [];
        const cookList = cookRes.data || [];
        const withDetails = (list) => Promise.all(list.map((o) => orderApi
            .detail(o.id)
            .then((r) => ({ ...o, ...(r.data || {}) }))
            .catch(() => ({ ...o, items: [] }))));
        const [pendDetails, cookDetails] = await Promise.all([
            withDetails(pendList),
            withDetails(cookList),
        ]);
        pending.value = pendDetails;
        cooking.value = cookDetails;
    }
    catch {
        // 忽略错误，保留上次数据
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
// 单个菜品状态流转：new -> cooking -> done
async function cycleItem(order, item) {
    if (item.status === 'done')
        return;
    const next = item.status === 'new' ? 'cooking' : 'done';
    try {
        await orderApi.updateItemStatus(order.id, item.id, next);
        item.status = next; // 乐观更新
        showToast(next === 'done' ? '已标记完成' : '已标记制作中');
    }
    catch {
        showToast('更新失败');
        fetchOrders(true);
    }
}
// 接单：pending -> cooking
async function acceptOrder(order) {
    try {
        await orderApi.updateStatus(order.id, 'cooking');
        showToast('已接单');
        fetchOrders(true);
    }
    catch {
        showToast('操作失败');
    }
}
// 出餐：cooking -> served（需全部菜品完成）
async function serveOrder(order) {
    if (!allDone(order)) {
        showToast('尚有未完成菜品');
        return;
    }
    try {
        await orderApi.updateStatus(order.id, 'served');
        showToast('已出餐');
        fetchOrders(true);
    }
    catch {
        showToast('操作失败');
    }
}
function onRefresh() {
    refreshing.value = true;
    fetchOrders(true);
}
function itemTagType(s) {
    if (s === 'done')
        return 'success';
    if (s === 'cooking')
        return 'warning';
    return 'primary';
}
function itemText(s) {
    if (s === 'done')
        return '已完成';
    if (s === 'cooking')
        return '制作中';
    return '待制作';
}
// 每 5 秒轮询刷新
let pollTimer = null;
onMounted(() => {
    fetchOrders();
    pollTimer = window.setInterval(() => fetchOrders(true), 5000);
});
onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['order-head']} */ ;
/** @type {__VLS_StyleScopedClasses['order-head']} */ ;
/** @type {__VLS_StyleScopedClasses['order-head']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "kitchen page" },
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
if (__VLS_ctx.loading) {
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
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "dot dot-pending" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "title" },
    });
    const __VLS_12 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        round: true,
        type: "warning",
    }));
    const __VLS_14 = __VLS_13({
        round: true,
        type: "warning",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    (__VLS_ctx.pending.length);
    var __VLS_15;
    if (__VLS_ctx.pending.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "order-list" },
        });
        for (const [o] of __VLS_getVForSourceType((__VLS_ctx.pending))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (o.id),
                ...{ class: "order-card card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "order-head" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "desk" },
            });
            (o.desk_number);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "orderno" },
            });
            (o.order_no);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "amount" },
            });
            (__VLS_ctx.fenToYuan(o.total_fen));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dish-list" },
            });
            for (const [item] of __VLS_getVForSourceType(((o.items || [])))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (item.id),
                    ...{ class: "dish-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "dish-main" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "dish-name" },
                });
                (item.dish_name);
                (item.quantity);
                if (item.remark) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "dish-remark" },
                    });
                    (item.remark);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.pending.length))
                                return;
                            __VLS_ctx.cycleItem(o, item);
                        } },
                    ...{ class: "tag-btn" },
                });
                const __VLS_16 = {}.VanTag;
                /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
                // @ts-ignore
                const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                    type: (__VLS_ctx.itemTagType(item.status)),
                    size: "medium",
                }));
                const __VLS_18 = __VLS_17({
                    type: (__VLS_ctx.itemTagType(item.status)),
                    size: "medium",
                }, ...__VLS_functionalComponentArgsRest(__VLS_17));
                __VLS_19.slots.default;
                (__VLS_ctx.itemText(item.status));
                var __VLS_19;
            }
            if (!(o.items || []).length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "empty-items" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "order-actions" },
            });
            const __VLS_20 = {}.VanButton;
            /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                ...{ 'onClick': {} },
                type: "primary",
                size: "small",
            }));
            const __VLS_22 = __VLS_21({
                ...{ 'onClick': {} },
                type: "primary",
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            let __VLS_24;
            let __VLS_25;
            let __VLS_26;
            const __VLS_27 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.pending.length))
                        return;
                    __VLS_ctx.acceptOrder(o);
                }
            };
            __VLS_23.slots.default;
            var __VLS_23;
        }
    }
    else {
        const __VLS_28 = {}.VanEmpty;
        /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            description: "暂无待接单订单",
            imageSize: "80",
        }));
        const __VLS_30 = __VLS_29({
            description: "暂无待接单订单",
            imageSize: "80",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "dot dot-cooking" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "title" },
    });
    const __VLS_32 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        round: true,
        type: "primary",
    }));
    const __VLS_34 = __VLS_33({
        round: true,
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    (__VLS_ctx.cooking.length);
    var __VLS_35;
    if (__VLS_ctx.cooking.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "order-list" },
        });
        for (const [o] of __VLS_getVForSourceType((__VLS_ctx.cooking))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (o.id),
                ...{ class: "order-card card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "order-head" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "desk" },
            });
            (o.desk_number);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "orderno" },
            });
            (o.order_no);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "amount" },
            });
            (__VLS_ctx.fenToYuan(o.total_fen));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dish-list" },
            });
            for (const [item] of __VLS_getVForSourceType(((o.items || [])))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (item.id),
                    ...{ class: "dish-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "dish-main" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "dish-name" },
                });
                (item.dish_name);
                (item.quantity);
                if (item.remark) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "dish-remark" },
                    });
                    (item.remark);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.cooking.length))
                                return;
                            __VLS_ctx.cycleItem(o, item);
                        } },
                    ...{ class: "tag-btn" },
                });
                const __VLS_36 = {}.VanTag;
                /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
                // @ts-ignore
                const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
                    type: (__VLS_ctx.itemTagType(item.status)),
                    size: "medium",
                }));
                const __VLS_38 = __VLS_37({
                    type: (__VLS_ctx.itemTagType(item.status)),
                    size: "medium",
                }, ...__VLS_functionalComponentArgsRest(__VLS_37));
                __VLS_39.slots.default;
                (__VLS_ctx.itemText(item.status));
                var __VLS_39;
            }
            if (!(o.items || []).length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "empty-items" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "order-actions" },
            });
            if (!__VLS_ctx.allDone(o)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "ready-tip" },
                });
            }
            const __VLS_40 = {}.VanButton;
            /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
            // @ts-ignore
            const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
                ...{ 'onClick': {} },
                type: "success",
                size: "small",
                disabled: (!__VLS_ctx.allDone(o)),
            }));
            const __VLS_42 = __VLS_41({
                ...{ 'onClick': {} },
                type: "success",
                size: "small",
                disabled: (!__VLS_ctx.allDone(o)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            let __VLS_44;
            let __VLS_45;
            let __VLS_46;
            const __VLS_47 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.cooking.length))
                        return;
                    __VLS_ctx.serveOrder(o);
                }
            };
            __VLS_43.slots.default;
            var __VLS_43;
        }
    }
    else {
        const __VLS_48 = {}.VanEmpty;
        /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
            description: "暂无制作中订单",
            imageSize: "80",
        }));
        const __VLS_50 = __VLS_49({
            description: "暂无制作中订单",
            imageSize: "80",
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    }
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['kitchen']} */ ;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-box']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot-pending']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['order-list']} */ ;
/** @type {__VLS_StyleScopedClasses['order-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['order-head']} */ ;
/** @type {__VLS_StyleScopedClasses['desk']} */ ;
/** @type {__VLS_StyleScopedClasses['orderno']} */ ;
/** @type {__VLS_StyleScopedClasses['amount']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-list']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-row']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-main']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-remark']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-items']} */ ;
/** @type {__VLS_StyleScopedClasses['order-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['dot-cooking']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['order-list']} */ ;
/** @type {__VLS_StyleScopedClasses['order-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['order-head']} */ ;
/** @type {__VLS_StyleScopedClasses['desk']} */ ;
/** @type {__VLS_StyleScopedClasses['orderno']} */ ;
/** @type {__VLS_StyleScopedClasses['amount']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-list']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-row']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-main']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-remark']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-items']} */ ;
/** @type {__VLS_StyleScopedClasses['order-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['ready-tip']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            fenToYuan: fenToYuan,
            VanPullRefresh: VanPullRefresh,
            VanEmpty: VanEmpty,
            VanButton: VanButton,
            VanTag: VanTag,
            VanLoading: VanLoading,
            pending: pending,
            cooking: cooking,
            loading: loading,
            refreshing: refreshing,
            allDone: allDone,
            cycleItem: cycleItem,
            acceptOrder: acceptOrder,
            serveOrder: serveOrder,
            onRefresh: onRefresh,
            itemTagType: itemTagType,
            itemText: itemText,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=OrderQueueView.vue.js.map