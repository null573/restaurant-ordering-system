import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CellGroup as VanCellGroup, Field as VanField, Button as VanButton, Icon as VanIcon, showToast, showSuccessToast, showFailToast, showLoadingToast, closeToast, } from 'vant';
import { subscriptionApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';
const auth = useAuthStore();
const router = useRouter();
const form = ref({
    name: '',
    contactPhone: '',
    wechatAppid: '',
    wechatMchid: '',
    trialDays: '',
    planPriceYuan: '',
    planCycleDays: '',
});
const saving = ref(false);
async function loadSettings() {
    try {
        const res = await subscriptionApi.getSettings();
        const s = res.data || {};
        form.value.wechatAppid = s.wechat_appid || '';
        form.value.wechatMchid = s.wechat_mchid || '';
        form.value.trialDays = s.trial_days != null ? String(s.trial_days) : '';
        form.value.planPriceYuan = fenToYuan(s.plan_price_fen ?? 0);
        form.value.planCycleDays = s.plan_cycle_days != null ? String(s.plan_cycle_days) : '';
        // 联系电话默认取当前登录账号手机号
        if (!form.value.contactPhone && auth.user?.phone) {
            form.value.contactPhone = auth.user.phone;
        }
    }
    catch (e) {
        showFailToast(e.message || '加载设置失败');
    }
}
async function onSave() {
    if (saving.value)
        return;
    saving.value = true;
    showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
    try {
        const data = {
            name: form.value.name.trim(),
            contactPhone: form.value.contactPhone.trim(),
            wechatAppid: form.value.wechatAppid.trim(),
            wechatMchid: form.value.wechatMchid.trim(),
            trialDays: parseInt(form.value.trialDays || '0', 10),
            planPriceFen: yuanToFen(form.value.planPriceYuan),
            planCycleDays: parseInt(form.value.planCycleDays || '0', 10),
        };
        const res = await subscriptionApi.updateSettings(data);
        if (res.code !== 0) {
            closeToast();
            showFailToast(res.message || '保存失败');
            return;
        }
        closeToast();
        showSuccessToast('保存成功');
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '保存失败');
    }
    finally {
        saving.value = false;
    }
}
async function onCopyLink() {
    const url = window.location.origin + '/';
    try {
        await navigator.clipboard.writeText(url);
        showSuccessToast('链接已复制');
    }
    catch {
        showToast(url);
    }
}
function onOpenAdmin() {
    router.push('/');
}
onMounted(() => {
    loadSettings();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page settings-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_0 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    inset: true,
}));
const __VLS_2 = __VLS_1({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    modelValue: (__VLS_ctx.form.name),
    label: "餐厅名称",
    placeholder: "请输入餐厅名称",
}));
const __VLS_6 = __VLS_5({
    modelValue: (__VLS_ctx.form.name),
    label: "餐厅名称",
    placeholder: "请输入餐厅名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
const __VLS_8 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    modelValue: (__VLS_ctx.form.contactPhone),
    label: "联系电话",
    type: "tel",
    maxlength: "11",
    placeholder: "用于小票与客服联系",
}));
const __VLS_10 = __VLS_9({
    modelValue: (__VLS_ctx.form.contactPhone),
    label: "联系电话",
    type: "tel",
    maxlength: "11",
    placeholder: "用于小票与客服联系",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-tip text-sm text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_12 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    inset: true,
}));
const __VLS_14 = __VLS_13({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.form.wechatAppid),
    label: "AppID",
    placeholder: "微信公众号/小程序 AppID",
    clearable: true,
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.form.wechatAppid),
    label: "AppID",
    placeholder: "微信公众号/小程序 AppID",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.form.wechatMchid),
    label: "商户号",
    placeholder: "微信支付商户号",
    clearable: true,
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.form.wechatMchid),
    label: "商户号",
    placeholder: "微信支付商户号",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-tip text-sm text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_24 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    inset: true,
}));
const __VLS_26 = __VLS_25({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.form.trialDays),
    label: "试用天数",
    type: "digit",
    placeholder: "如 7",
}));
const __VLS_30 = __VLS_29({
    modelValue: (__VLS_ctx.form.trialDays),
    label: "试用天数",
    type: "digit",
    placeholder: "如 7",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    modelValue: (__VLS_ctx.form.planPriceYuan),
    label: "付费金额(元)",
    type: "number",
    placeholder: "如 99.00",
}));
const __VLS_34 = __VLS_33({
    modelValue: (__VLS_ctx.form.planPriceYuan),
    label: "付费金额(元)",
    type: "number",
    placeholder: "如 99.00",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    modelValue: (__VLS_ctx.form.planCycleDays),
    label: "付费周期(天)",
    type: "digit",
    placeholder: "如 30",
}));
const __VLS_38 = __VLS_37({
    modelValue: (__VLS_ctx.form.planCycleDays),
    label: "付费周期(天)",
    type: "digit",
    placeholder: "如 30",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-tip text-sm text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "save-bar" },
});
const __VLS_40 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    type: "primary",
    loading: (__VLS_ctx.saving),
}));
const __VLS_42 = __VLS_41({
    ...{ 'onClick': {} },
    block: true,
    round: true,
    type: "primary",
    loading: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onClick: (__VLS_ctx.onSave)
};
__VLS_43.slots.default;
var __VLS_43;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "web-admin card" },
});
const __VLS_48 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    name: "desktop-o",
    size: "28",
    color: "var(--primary)",
}));
const __VLS_50 = __VLS_49({
    name: "desktop-o",
    size: "28",
    color: "var(--primary)",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "web-admin-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "web-admin-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "web-admin-actions" },
});
const __VLS_52 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ 'onClick': {} },
    plain: true,
    type: "primary",
    size: "small",
    icon: "link-o",
}));
const __VLS_54 = __VLS_53({
    ...{ 'onClick': {} },
    plain: true,
    type: "primary",
    size: "small",
    icon: "link-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_56;
let __VLS_57;
let __VLS_58;
const __VLS_59 = {
    onClick: (__VLS_ctx.onCopyLink)
};
__VLS_55.slots.default;
var __VLS_55;
const __VLS_60 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ 'onClick': {} },
    plain: true,
    type: "primary",
    size: "small",
    icon: "apps-o",
}));
const __VLS_62 = __VLS_61({
    ...{ 'onClick': {} },
    plain: true,
    type: "primary",
    size: "small",
    icon: "apps-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_64;
let __VLS_65;
let __VLS_66;
const __VLS_67 = {
    onClick: (__VLS_ctx.onOpenAdmin)
};
__VLS_63.slots.default;
var __VLS_63;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['save-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['web-admin']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['web-admin-body']} */ ;
/** @type {__VLS_StyleScopedClasses['web-admin-title']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['web-admin-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanCellGroup: VanCellGroup,
            VanField: VanField,
            VanButton: VanButton,
            VanIcon: VanIcon,
            form: form,
            saving: saving,
            onSave: onSave,
            onCopyLink: onCopyLink,
            onOpenAdmin: onOpenAdmin,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SettingsView.vue.js.map