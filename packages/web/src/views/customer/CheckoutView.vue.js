import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Field as VanField, Button as VanButton, Icon as VanIcon, Empty as VanEmpty, showFailToast, showLoadingToast, closeToast, showDialog, } from 'vant';
import { customerApi, paymentApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';
const route = useRoute();
const router = useRouter();
const qrToken = route.params.qrToken;
const cartStorageKey = `cart_${qrToken}`;
const cart = ref([]);
const remark = ref('');
const payMethod = ref(null);
const submitting = ref(false);
const totalFen = computed(() => cart.value.reduce((sum, i) => sum + i.priceFen * i.quantity, 0));
const submitText = computed(() => {
    if (!payMethod.value)
        return '请选择结账方式';
    if (payMethod.value === 'wechat')
        return '确认并支付';
    return '提交订单';
});
function buildItems() {
    return cart.value.map((c) => ({
        dishId: c.dishId,
        name: c.name,
        priceFen: c.priceFen,
        quantity: c.quantity,
        remark: '',
    }));
}
async function payWechat() {
    if (cart.value.length === 0)
        return;
    submitting.value = true;
    showLoadingToast({ message: '提交订单中...', forbidClick: true, duration: 0 });
    try {
        const res = await customerApi.submitOrder(qrToken, {
            items: buildItems(),
            remark: remark.value,
        });
        const orderId = res.data?.orderId;
        if (!orderId) {
            closeToast();
            showFailToast('创建订单失败');
            return;
        }
        // 调用 H5 支付，获取微信支付跳转链接
        const payRes = await paymentApi.h5({ orderId });
        closeToast();
        const h5Url = payRes.data?.h5Url;
        if (h5Url) {
            sessionStorage.removeItem(cartStorageKey);
            window.location.href = h5Url;
        }
        else {
            showFailToast('未获取到支付链接');
        }
    }
    catch (err) {
        closeToast();
        showFailToast(err?.response?.data?.message || err?.message || '提交订单失败');
    }
    finally {
        submitting.value = false;
    }
}
async function payBar() {
    if (cart.value.length === 0)
        return;
    submitting.value = true;
    showLoadingToast({ message: '提交订单中...', forbidClick: true, duration: 0 });
    try {
        await customerApi.submitOrder(qrToken, {
            items: buildItems(),
            remark: remark.value,
        });
        closeToast();
        sessionStorage.removeItem(cartStorageKey);
        await showDialog({
            title: '下单成功',
            message: '请到吧台结账',
            confirmButtonText: '我知道了',
            confirmButtonColor: 'var(--primary)',
        });
        router.replace(`/c/${qrToken}`);
    }
    catch (err) {
        closeToast();
        showFailToast(err?.response?.data?.message || err?.message || '提交订单失败');
    }
    finally {
        submitting.value = false;
    }
}
function onSubmit() {
    if (cart.value.length === 0) {
        showFailToast('购物车为空');
        return;
    }
    if (!payMethod.value) {
        showFailToast('请选择结账方式');
        return;
    }
    if (payMethod.value === 'wechat')
        payWechat();
    else
        payBar();
}
onMounted(() => {
    const saved = sessionStorage.getItem(cartStorageKey);
    if (saved) {
        try {
            cart.value = JSON.parse(saved);
        }
        catch {
            cart.value = [];
        }
    }
    if (cart.value.length === 0) {
        showFailToast('购物车为空');
        setTimeout(() => router.replace(`/c/${qrToken}`), 1200);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['order-item']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page checkout-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "checkout-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.back();
        } },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
if (__VLS_ctx.cart.length === 0) {
    const __VLS_4 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        description: "购物车为空",
        imageSize: "80",
    }));
    const __VLS_6 = __VLS_5({
        description: "购物车为空",
        imageSize: "80",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "order-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.cart))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (item.dishId),
            ...{ class: "order-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "oi-name" },
        });
        (item.name);
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
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section card" },
});
const __VLS_8 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    modelValue: (__VLS_ctx.remark),
    label: "订单备注",
    type: "textarea",
    placeholder: "如有忌口、口味等特殊要求请填写",
    rows: "1",
    autosize: true,
    maxlength: "100",
    showWordLimit: true,
}));
const __VLS_10 = __VLS_9({
    modelValue: (__VLS_ctx.remark),
    label: "订单备注",
    type: "textarea",
    placeholder: "如有忌口、口味等特殊要求请填写",
    rows: "1",
    autosize: true,
    maxlength: "100",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "total-bar card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "total-amount" },
});
(__VLS_ctx.fenToYuan(__VLS_ctx.totalFen));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-options" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.payMethod = 'wechat';
        } },
    ...{ class: "pay-card card" },
    ...{ class: ({ active: __VLS_ctx.payMethod === 'wechat' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-icon wechat-icon" },
});
const __VLS_12 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    name: "chat-o",
    size: "22",
}));
const __VLS_14 = __VLS_13({
    name: "chat-o",
    size: "22",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-name" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-desc text-sm text-secondary" },
});
const __VLS_16 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    name: (__VLS_ctx.payMethod === 'wechat' ? 'success' : 'circle'),
    color: (__VLS_ctx.payMethod === 'wechat' ? 'var(--primary)' : '#c8c9cc'),
    size: "20",
}));
const __VLS_18 = __VLS_17({
    name: (__VLS_ctx.payMethod === 'wechat' ? 'success' : 'circle'),
    color: (__VLS_ctx.payMethod === 'wechat' ? 'var(--primary)' : '#c8c9cc'),
    size: "20",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.payMethod = 'bar';
        } },
    ...{ class: "pay-card card" },
    ...{ class: ({ active: __VLS_ctx.payMethod === 'bar' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-icon bar-icon" },
});
const __VLS_20 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    name: "balance-o",
    size: "22",
}));
const __VLS_22 = __VLS_21({
    name: "balance-o",
    size: "22",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-name" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pay-desc text-sm text-secondary" },
});
const __VLS_24 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    name: (__VLS_ctx.payMethod === 'bar' ? 'success' : 'circle'),
    color: (__VLS_ctx.payMethod === 'bar' ? 'var(--primary)' : '#c8c9cc'),
    size: "20",
}));
const __VLS_26 = __VLS_25({
    name: (__VLS_ctx.payMethod === 'bar' ? 'success' : 'circle'),
    color: (__VLS_ctx.payMethod === 'bar' ? 'var(--primary)' : '#c8c9cc'),
    size: "20",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    block: true,
    ...{ class: "btn-gradient submit-btn" },
    loading: (__VLS_ctx.submitting),
    disabled: (__VLS_ctx.cart.length === 0 || !__VLS_ctx.payMethod),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    block: true,
    ...{ class: "btn-gradient submit-btn" },
    loading: (__VLS_ctx.submitting),
    disabled: (__VLS_ctx.cart.length === 0 || !__VLS_ctx.payMethod),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.onSubmit)
};
__VLS_31.slots.default;
(__VLS_ctx.submitText);
var __VLS_31;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['checkout-page']} */ ;
/** @type {__VLS_StyleScopedClasses['checkout-header']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['header-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['order-list']} */ ;
/** @type {__VLS_StyleScopedClasses['order-item']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-name']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-qty']} */ ;
/** @type {__VLS_StyleScopedClasses['oi-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['total-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['total-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-options']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['wechat-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-name']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-name']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanField: VanField,
            VanButton: VanButton,
            VanIcon: VanIcon,
            VanEmpty: VanEmpty,
            fenToYuan: fenToYuan,
            router: router,
            cart: cart,
            remark: remark,
            payMethod: payMethod,
            submitting: submitting,
            totalFen: totalFen,
            submitText: submitText,
            onSubmit: onSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=CheckoutView.vue.js.map