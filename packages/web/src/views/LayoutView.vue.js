import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NavBar as VanNavBar, Tabbar as VanTabbar, TabbarItem as VanTabbarItem, ActionSheet as VanActionSheet, } from 'vant';
const route = useRoute();
const router = useRouter();
// 从 localStorage 读取 userInfo（餐厅名 + 角色）
function readUserInfo() {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
    }
    catch {
        return {};
    }
}
const userInfo = readUserInfo();
const restaurantName = userInfo.name || '我的餐厅';
const role = userInfo.role || '';
// 角色可见性：
// - owner  可见全部（吧台 / 厨房 / 管理，管理含全部 6 项）
// - manager 隐藏"设置"（管理菜单含 5 项）
// - bar / kitchen 只可见吧台和厨房（无管理入口）
const showManage = role === 'owner' || role === 'manager';
const adminItems = computed(() => {
    const items = [
        { name: '菜品管理', path: '/admin/dishes' },
        { name: '桌位管理', path: '/admin/desks' },
        { name: '二维码', path: '/admin/qrcodes' },
        { name: '订阅', path: '/admin/subscription' },
        { name: '店员', path: '/admin/users' },
    ];
    if (role === 'owner') {
        items.push({ name: '设置', path: '/admin/settings' });
    }
    return items;
});
const sheetActions = computed(() => adminItems.value.map((i) => ({ name: i.name, path: i.path })));
const showSheet = ref(false);
function onSelect(action) {
    if (action.path) {
        router.push(action.path);
    }
}
// 底部 tab 高亮（单向 model-value + 计算属性，避免 v-model 双向回写类型问题）
// 管理菜单打开或在管理页面时高亮"管理"，其余按路由高亮吧台/厨房
const active = computed(() => {
    if (showSheet.value)
        return 2;
    if (route.path.startsWith('/kitchen'))
        return 1;
    if (route.path.startsWith('/admin') && showManage)
        return 2;
    return 0; // 吧台为默认
});
function onTabChange(index) {
    const i = Number(index);
    if (i === 0) {
        router.push('/bar');
    }
    else if (i === 1) {
        router.push('/kitchen');
    }
    else if (i === 2 && showManage) {
        showSheet.value = true;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "layout" },
});
const __VLS_0 = {}.VanNavBar;
/** @type {[typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "layout-nav" },
    title: (__VLS_ctx.restaurantName),
    fixed: true,
    placeholder: true,
}));
const __VLS_2 = __VLS_1({
    ...{ class: "layout-nav" },
    title: (__VLS_ctx.restaurantName),
    fixed: true,
    placeholder: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "layout-main" },
});
const __VLS_4 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
const __VLS_8 = {}.VanTabbar;
/** @type {[typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.active),
    placeholder: true,
    safeAreaInsetBottom: true,
}));
const __VLS_10 = __VLS_9({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.active),
    placeholder: true,
    safeAreaInsetBottom: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onChange: (__VLS_ctx.onTabChange)
};
__VLS_11.slots.default;
const __VLS_16 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    icon: "shop-o",
}));
const __VLS_18 = __VLS_17({
    icon: "shop-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
const __VLS_20 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    icon: "fire-o",
}));
const __VLS_22 = __VLS_21({
    icon: "fire-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
if (__VLS_ctx.showManage) {
    const __VLS_24 = {}.VanTabbarItem;
    /** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        icon: "apps-o",
    }));
    const __VLS_26 = __VLS_25({
        icon: "apps-o",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    var __VLS_27;
}
var __VLS_11;
const __VLS_28 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showSheet),
    title: "管理菜单",
    actions: (__VLS_ctx.sheetActions),
    closeOnClickAction: true,
    cancelText: "取消",
}));
const __VLS_30 = __VLS_29({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showSheet),
    title: "管理菜单",
    actions: (__VLS_ctx.sheetActions),
    closeOnClickAction: true,
    cancelText: "取消",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onSelect: (__VLS_ctx.onSelect)
};
var __VLS_31;
/** @type {__VLS_StyleScopedClasses['layout']} */ ;
/** @type {__VLS_StyleScopedClasses['layout-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['layout-main']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanNavBar: VanNavBar,
            VanTabbar: VanTabbar,
            VanTabbarItem: VanTabbarItem,
            VanActionSheet: VanActionSheet,
            restaurantName: restaurantName,
            showManage: showManage,
            sheetActions: sheetActions,
            showSheet: showSheet,
            onSelect: onSelect,
            active: active,
            onTabChange: onTabChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=LayoutView.vue.js.map