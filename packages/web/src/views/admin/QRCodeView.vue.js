import { ref, onMounted, nextTick } from 'vue';
import { PullRefresh as VanPullRefresh, Empty as VanEmpty, Loading as VanLoading, Button as VanButton, showToast, showFailToast, showSuccessToast, showLoadingToast, closeToast, } from 'vant';
import { deskApi } from '../../api';
import { renderQRCode, downloadQRCode, downloadAllQRCodes, } from '../../utils/qrcode';
const qrList = ref([]);
const gridRef = ref(null);
const loading = ref(false);
const refreshing = ref(false);
const downloadingAll = ref(false);
async function loadQR() {
    loading.value = true;
    try {
        const res = await deskApi.getAllQRCodes();
        qrList.value = (res.data || []);
        // 等待 DOM 渲染出 canvas 后再绘制
        await nextTick();
        await renderAll();
    }
    catch (e) {
        showFailToast(e.message || '加载失败');
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
async function renderAll() {
    const canvases = gridRef.value?.querySelectorAll('canvas.qr-canvas');
    if (!canvases || canvases.length === 0)
        return;
    // 逐个渲染，失败不影响其他
    const tasks = [];
    canvases.forEach((canvas) => {
        const token = canvas.dataset.token;
        const item = qrList.value.find((d) => d.qrToken === token);
        if (!item)
            return;
        tasks.push(renderQRCode(canvas, item.qrUrl, 256).catch(() => {
            /* 单个渲染失败忽略 */
        }));
    });
    await Promise.all(tasks);
}
async function onDownloadOne(item) {
    try {
        await downloadQRCode(item);
        showToast('已下载');
    }
    catch (e) {
        showFailToast(e.message || '下载失败');
    }
}
async function onDownloadAll() {
    if (downloadingAll.value)
        return;
    downloadingAll.value = true;
    showLoadingToast({ message: '生成打印页...', forbidClick: true, duration: 0 });
    try {
        await downloadAllQRCodes(qrList.value);
        closeToast();
        showSuccessToast('已生成打印页');
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '生成失败');
    }
    finally {
        downloadingAll.value = false;
    }
}
onMounted(() => {
    loadQR();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page qr-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm text-secondary" },
});
(__VLS_ctx.qrList.length);
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
    onRefresh: (__VLS_ctx.loadQR)
};
__VLS_3.slots.default;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-wrap" },
    });
    const __VLS_8 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        size: "24",
    }));
    const __VLS_10 = __VLS_9({
        size: "24",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    var __VLS_11;
}
else if (__VLS_ctx.qrList.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-wrap" },
    });
    const __VLS_12 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        description: "暂无桌位二维码，请先添加桌位",
    }));
    const __VLS_14 = __VLS_13({
        description: "暂无桌位二维码，请先添加桌位",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ref: "gridRef",
        ...{ class: "qr-grid" },
    });
    /** @type {typeof __VLS_ctx.gridRef} */ ;
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.qrList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (item.deskId),
            ...{ class: "qr-card card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.canvas, __VLS_intrinsicElements.canvas)({
            ...{ class: "qr-canvas" },
            'data-token': (item.qrToken),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "qr-desk-no" },
        });
        (item.deskNumber);
        if (item.deskName) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "qr-desk-name text-sm text-secondary" },
            });
            (item.deskName);
        }
        const __VLS_16 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            ...{ 'onClick': {} },
            size: "small",
            plain: true,
            type: "primary",
            icon: "down",
            ...{ class: "qr-dl-btn" },
        }));
        const __VLS_18 = __VLS_17({
            ...{ 'onClick': {} },
            size: "small",
            plain: true,
            type: "primary",
            icon: "down",
            ...{ class: "qr-dl-btn" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        let __VLS_20;
        let __VLS_21;
        let __VLS_22;
        const __VLS_23 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.qrList.length === 0))
                    return;
                __VLS_ctx.onDownloadOne(item);
            }
        };
        __VLS_19.slots.default;
        var __VLS_19;
    }
}
var __VLS_3;
if (__VLS_ctx.qrList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "qr-footer" },
    });
    const __VLS_24 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        type: "primary",
        icon: "printer",
        loading: (__VLS_ctx.downloadingAll),
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        type: "primary",
        icon: "printer",
        loading: (__VLS_ctx.downloadingAll),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (__VLS_ctx.onDownloadAll)
    };
    __VLS_27.slots.default;
    var __VLS_27;
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-desk-no']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-desk-name']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-dl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-footer']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanPullRefresh: VanPullRefresh,
            VanEmpty: VanEmpty,
            VanLoading: VanLoading,
            VanButton: VanButton,
            qrList: qrList,
            gridRef: gridRef,
            loading: loading,
            refreshing: refreshing,
            downloadingAll: downloadingAll,
            loadQR: loadQR,
            onDownloadOne: onDownloadOne,
            onDownloadAll: onDownloadAll,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=QRCodeView.vue.js.map