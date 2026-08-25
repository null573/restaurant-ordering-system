import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Form as VanForm, Field as VanField, CellGroup as VanCellGroup, Button as VanButton, showSuccessToast, showFailToast, } from 'vant';
import { useAuthStore } from '../stores/auth';
const router = useRouter();
const auth = useAuthStore();
const phone = ref('');
const password = ref('');
const loading = ref(false);
async function onSubmit() {
    if (loading.value)
        return;
    loading.value = true;
    try {
        await auth.login(phone.value, password.value);
        showSuccessToast('登录成功');
        router.push('/bar');
    }
    catch (err) {
        showFailToast(err?.response?.data?.message || err?.message || '登录失败，请重试');
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['register-link']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page login-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "logo-circle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "brand-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "brand-subtitle" },
});
const __VLS_0 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ...{ class: "login-form" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ...{ class: "login-form" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSubmit: (__VLS_ctx.onSubmit)
};
__VLS_3.slots.default;
const __VLS_8 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    inset: true,
}));
const __VLS_10 = __VLS_9({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    modelValue: (__VLS_ctx.phone),
    name: "phone",
    label: "手机号",
    type: "tel",
    placeholder: "请输入手机号",
    clearable: true,
    rules: ([
        { required: true, message: '请输入手机号' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
    ]),
}));
const __VLS_14 = __VLS_13({
    modelValue: (__VLS_ctx.phone),
    name: "phone",
    label: "手机号",
    type: "tel",
    placeholder: "请输入手机号",
    clearable: true,
    rules: ([
        { required: true, message: '请输入手机号' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.password),
    type: "password",
    name: "password",
    label: "密码",
    placeholder: "请输入密码",
    clearable: true,
    rules: ([{ required: true, message: '请输入密码' }]),
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.password),
    type: "password",
    name: "password",
    label: "密码",
    placeholder: "请输入密码",
    clearable: true,
    rules: ([{ required: true, message: '请输入密码' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-actions" },
});
const __VLS_20 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    block: true,
    ...{ class: "btn-gradient submit-btn" },
    nativeType: "submit",
    loading: (__VLS_ctx.loading),
    loadingText: "登录中...",
}));
const __VLS_22 = __VLS_21({
    block: true,
    ...{ class: "btn-gradient submit-btn" },
    nativeType: "submit",
    loading: (__VLS_ctx.loading),
    loadingText: "登录中...",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "register-link" },
});
const __VLS_24 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    to: "/register",
    ...{ class: "text-primary" },
}));
const __VLS_26 = __VLS_25({
    to: "/register",
    ...{ class: "text-primary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
var __VLS_27;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['login-page']} */ ;
/** @type {__VLS_StyleScopedClasses['login-header']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-title']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['login-form']} */ ;
/** @type {__VLS_StyleScopedClasses['login-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['register-link']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanForm: VanForm,
            VanField: VanField,
            VanCellGroup: VanCellGroup,
            VanButton: VanButton,
            phone: phone,
            password: password,
            loading: loading,
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
//# sourceMappingURL=LoginView.vue.js.map