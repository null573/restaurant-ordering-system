import { ref, computed, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import { Tag as VanTag, Button as VanButton, CellGroup as VanCellGroup, Field as VanField, Popup as VanPopup, Empty as VanEmpty, Loading as VanLoading, showToast, showSuccessToast, showFailToast, showLoadingToast, closeToast, } from 'vant';
import { subscriptionApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';
const auth = useAuthStore();
const isOwner = computed(() => auth.role === 'owner');
const status = ref(null);
const payments = ref([]);
// 设置表单
const settingsForm = ref({
    trialDays: '',
    planPriceYuan: '',
    planCycleDays: '',
    wechatAppid: '',
    wechatMchid: '',
});
const savingSettings = ref(false);
// 支付
const paying = ref(false);
const showQrPopup = ref(false);
const payResult = ref(null);
const payQrDataUrl = ref('');
const polling = ref(false);
let pollTimer = null;
let pollCount = 0;
const statusTag = computed(() => {
    if (!status.value)
        return { label: '未知', type: 'default' };
    if (status.value.isActive)
        return { label: '已付费', type: 'success' };
    if (status.value.isTrial)
        return { label: '试用中', type: 'warning' };
    return { label: '已过期', type: 'danger' };
});
const remainHint = computed(() => {
    if (!status.value)
        return '';
    if (status.value.isActive)
        return '剩余服务时长';
    if (status.value.isTrial)
        return '试用剩余天数';
    return '订阅已过期，请尽快续费';
});
const canPay = computed(() => !!(settings.value?.wechat_appid && settings.value?.wechat_mchid));
const settings = ref(null);
function formatDate(iso) {
    if (!iso)
        return '—';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime()))
            return iso;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    catch {
        return iso;
    }
}
async function loadStatus() {
    try {
        const res = await subscriptionApi.status();
        status.value = res.data;
        // 关闭可能存在的轮询
        stopPolling();
    }
    catch (e) {
        showFailToast(e.message || '获取状态失败');
    }
}
async function loadSettings() {
    if (!isOwner.value)
        return;
    try {
        const res = await subscriptionApi.getSettings();
        const s = res.data;
        settings.value = s;
        settingsForm.value = {
            trialDays: String(s.trial_days ?? ''),
            planPriceYuan: fenToYuan(s.plan_price_fen ?? 0),
            planCycleDays: String(s.plan_cycle_days ?? ''),
            wechatAppid: s.wechat_appid || '',
            wechatMchid: s.wechat_mchid || '',
        };
    }
    catch (e) {
        // 非致命
        console.warn('获取设置失败', e);
    }
}
async function loadPayments() {
    try {
        const res = await subscriptionApi.getPayments();
        payments.value = (res.data || []);
    }
    catch (e) {
        // 静默
    }
}
async function onPay() {
    if (paying.value)
        return;
    if (!status.value)
        return;
    if (!settings.value?.wechat_appid || !settings.value?.wechat_mchid) {
        showFailToast('请先在设置中配置微信支付信息');
        return;
    }
    paying.value = true;
    try {
        const res = await subscriptionApi.pay({ cycleDays: status.value.planCycleDays });
        if (res.code !== 0) {
            showFailToast(res.message || '创建支付失败');
            return;
        }
        payResult.value = res.data;
        payQrDataUrl.value = await QRCode.toDataURL(res.data.codeUrl, {
            width: 280,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        });
        showQrPopup.value = true;
        // 开启轮询查询支付状态
        startPolling();
    }
    catch (e) {
        showFailToast(e.message || '创建支付失败');
    }
    finally {
        paying.value = false;
    }
}
function startPolling() {
    stopPolling();
    pollCount = 0;
    polling.value = true;
    pollTimer = setInterval(async () => {
        pollCount++;
        if (pollCount > 40) {
            // 超过约 2 分钟停止
            stopPolling();
            return;
        }
        try {
            const res = await subscriptionApi.status();
            if (res.data?.isActive) {
                stopPolling();
                showQrPopup.value = false;
                status.value = res.data;
                showSuccessToast('支付成功');
                await loadPayments();
            }
        }
        catch {
            /* 忽略轮询错误 */
        }
    }, 3000);
}
function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    polling.value = false;
}
async function onPayFinished() {
    await loadStatus();
    if (status.value?.isActive) {
        showQrPopup.value = false;
        showSuccessToast('支付成功');
        await loadPayments();
    }
    else {
        showToast('暂未检测到支付完成，请稍后重试');
    }
}
async function onSaveSettings() {
    if (savingSettings.value)
        return;
    savingSettings.value = true;
    showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
    try {
        const data = {
            trialDays: parseInt(settingsForm.value.trialDays || '0', 10),
            planPriceFen: yuanToFen(settingsForm.value.planPriceYuan),
            planCycleDays: parseInt(settingsForm.value.planCycleDays || '0', 10),
            wechatAppid: settingsForm.value.wechatAppid.trim(),
            wechatMchid: settingsForm.value.wechatMchid.trim(),
        };
        const res = await subscriptionApi.updateSettings(data);
        if (res.code !== 0) {
            closeToast();
            showFailToast(res.message || '保存失败');
            return;
        }
        closeToast();
        showSuccessToast('保存成功');
        await Promise.all([loadSettings(), loadStatus()]);
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '保存失败');
    }
    finally {
        savingSettings.value = false;
    }
}
onMounted(async () => {
    await Promise.all([loadStatus(), loadSettings(), loadPayments()]);
});
onUnmounted(() => {
    stopPolling();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pay-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page sub-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-card card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-secondary" },
});
const __VLS_0 = {}.VanTag;
/** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    type: (__VLS_ctx.statusTag.type),
    size: "large",
    round: true,
}));
const __VLS_2 = __VLS_1({
    type: (__VLS_ctx.statusTag.type),
    size: "large",
    round: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
(__VLS_ctx.statusTag.label);
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-days" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "days-num" },
});
(__VLS_ctx.status?.remainingDays ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "days-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-secondary" },
});
(__VLS_ctx.remainHint);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.formatDate(__VLS_ctx.status?.paidUntil || __VLS_ctx.status?.trialEndAt));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.status?.planCycleDays ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-primary" },
});
(__VLS_ctx.fenToYuan(__VLS_ctx.status?.planPriceFen ?? 0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status-actions" },
});
const __VLS_4 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    type: "primary",
    loading: (__VLS_ctx.paying),
    disabled: (!__VLS_ctx.canPay),
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    type: "primary",
    loading: (__VLS_ctx.paying),
    disabled: (!__VLS_ctx.canPay),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.onPay)
};
__VLS_7.slots.default;
(__VLS_ctx.status?.isActive ? '续费' : '立即付费');
var __VLS_7;
const __VLS_12 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    plain: true,
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.loadStatus)
};
__VLS_15.slots.default;
var __VLS_15;
if (__VLS_ctx.isOwner) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_20 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        inset: true,
    }));
    const __VLS_22 = __VLS_21({
        inset: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    const __VLS_24 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        modelValue: (__VLS_ctx.settingsForm.trialDays),
        label: "试用天数",
        type: "digit",
        placeholder: "如 7",
    }));
    const __VLS_26 = __VLS_25({
        modelValue: (__VLS_ctx.settingsForm.trialDays),
        label: "试用天数",
        type: "digit",
        placeholder: "如 7",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    const __VLS_28 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        modelValue: (__VLS_ctx.settingsForm.planPriceYuan),
        label: "付费金额(元)",
        type: "number",
        placeholder: "如 99.00",
    }));
    const __VLS_30 = __VLS_29({
        modelValue: (__VLS_ctx.settingsForm.planPriceYuan),
        label: "付费金额(元)",
        type: "number",
        placeholder: "如 99.00",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    const __VLS_32 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        modelValue: (__VLS_ctx.settingsForm.planCycleDays),
        label: "付费周期(天)",
        type: "digit",
        placeholder: "如 30",
    }));
    const __VLS_34 = __VLS_33({
        modelValue: (__VLS_ctx.settingsForm.planCycleDays),
        label: "付费周期(天)",
        type: "digit",
        placeholder: "如 30",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    const __VLS_36 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        modelValue: (__VLS_ctx.settingsForm.wechatAppid),
        label: "微信AppID",
        placeholder: "微信公众号/小程序 AppID",
    }));
    const __VLS_38 = __VLS_37({
        modelValue: (__VLS_ctx.settingsForm.wechatAppid),
        label: "微信AppID",
        placeholder: "微信公众号/小程序 AppID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const __VLS_40 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.settingsForm.wechatMchid),
        label: "微信商户号",
        placeholder: "微信支付商户号",
    }));
    const __VLS_42 = __VLS_41({
        modelValue: (__VLS_ctx.settingsForm.wechatMchid),
        label: "微信商户号",
        placeholder: "微信支付商户号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    var __VLS_23;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-actions" },
    });
    const __VLS_44 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        type: "primary",
        loading: (__VLS_ctx.savingSettings),
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        type: "primary",
        loading: (__VLS_ctx.savingSettings),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (__VLS_ctx.onSaveSettings)
    };
    __VLS_47.slots.default;
    var __VLS_47;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_52 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    inset: true,
}));
const __VLS_54 = __VLS_53({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
for (const [p] of __VLS_getVForSourceType((__VLS_ctx.payments))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (p.id),
        ...{ class: "pay-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pay-left" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pay-no" },
    });
    (p.out_trade_no);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-secondary" },
    });
    (__VLS_ctx.formatDate(p.paid_at || p.created_at));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pay-right" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pay-amount" },
    });
    (__VLS_ctx.fenToYuan(p.amount_fen));
    const __VLS_56 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        type: (p.status === 'paid' ? 'success' : 'warning'),
        size: "medium",
    }));
    const __VLS_58 = __VLS_57({
        type: (p.status === 'paid' ? 'success' : 'warning'),
        size: "medium",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    (p.status === 'paid' ? '已支付' : '待支付');
    var __VLS_59;
}
if (__VLS_ctx.payments.length === 0) {
    const __VLS_60 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        description: "暂无支付记录",
        imageSize: "80",
    }));
    const __VLS_62 = __VLS_61({
        description: "暂无支付记录",
        imageSize: "80",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
}
var __VLS_55;
const __VLS_64 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    show: (__VLS_ctx.showQrPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
    ...{ style: ({ maxHeight: '85%' }) },
}));
const __VLS_66 = __VLS_65({
    show: (__VLS_ctx.showQrPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
    ...{ style: ({ maxHeight: '85%' }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "qr-popup" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "qr-amount" },
});
(__VLS_ctx.fenToYuan(__VLS_ctx.payResult?.amountFen ?? 0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "qr-amount-sub text-sm text-secondary" },
});
(__VLS_ctx.payResult?.cycleDays ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "qr-img-wrap" },
});
if (__VLS_ctx.payQrDataUrl) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.payQrDataUrl),
        ...{ class: "qr-img" },
        alt: "微信支付二维码",
    });
}
else {
    const __VLS_68 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        size: "24",
    }));
    const __VLS_70 = __VLS_69({
        size: "24",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    var __VLS_71;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-secondary qr-tip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "qr-popup-actions" },
});
const __VLS_72 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    type: "primary",
    loading: (__VLS_ctx.polling),
}));
const __VLS_74 = __VLS_73({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    type: "primary",
    loading: (__VLS_ctx.polling),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_76;
let __VLS_77;
let __VLS_78;
const __VLS_79 = {
    onClick: (__VLS_ctx.onPayFinished)
};
__VLS_75.slots.default;
var __VLS_75;
var __VLS_67;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-page']} */ ;
/** @type {__VLS_StyleScopedClasses['status-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['status-days']} */ ;
/** @type {__VLS_StyleScopedClasses['days-num']} */ ;
/** @type {__VLS_StyleScopedClasses['days-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['status-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['status-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-row']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-left']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-no']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-right']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-popup']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-title']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-amount-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-img-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-img']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-popup-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanTag: VanTag,
            VanButton: VanButton,
            VanCellGroup: VanCellGroup,
            VanField: VanField,
            VanPopup: VanPopup,
            VanEmpty: VanEmpty,
            VanLoading: VanLoading,
            fenToYuan: fenToYuan,
            isOwner: isOwner,
            status: status,
            payments: payments,
            settingsForm: settingsForm,
            savingSettings: savingSettings,
            paying: paying,
            showQrPopup: showQrPopup,
            payResult: payResult,
            payQrDataUrl: payQrDataUrl,
            polling: polling,
            statusTag: statusTag,
            remainHint: remainHint,
            canPay: canPay,
            formatDate: formatDate,
            loadStatus: loadStatus,
            onPay: onPay,
            onPayFinished: onPayFinished,
            onSaveSettings: onSaveSettings,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SubscriptionView.vue.js.map