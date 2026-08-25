import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Sidebar as VanSidebar, SidebarItem as VanSidebarItem, Image as VanImage, Button as VanButton, Icon as VanIcon, SubmitBar as VanSubmitBar, Empty as VanEmpty, Loading as VanLoading, showToast, showFailToast, } from 'vant';
import { customerApi } from '../../api';
import { fenToYuan } from '../../utils/qrcode';
const route = useRoute();
const router = useRouter();
const qrToken = route.params.qrToken;
const cartStorageKey = `cart_${qrToken}`;
const tenantName = ref('');
const deskNumber = ref('');
const deskName = ref(null);
const categories = ref([]);
const dishes = ref([]);
const cart = ref([]);
const loaded = ref(false);
const activeCategory = ref(0); // 0 = 全部
// 分类列表，首位为「全部」
const categoryList = computed(() => [
    { id: '', name: '全部', sort_order: -1 },
    ...categories.value,
]);
const filteredDishes = computed(() => {
    if (activeCategory.value === 0)
        return dishes.value;
    const cat = categoryList.value[activeCategory.value];
    if (!cat)
        return [];
    return dishes.value.filter((d) => d.category_id === cat.id);
});
const deskLabel = computed(() => {
    if (deskName.value)
        return `${deskName.value}（桌号 ${deskNumber.value}）`;
    return `桌号 ${deskNumber.value}`;
});
const totalCount = computed(() => cart.value.reduce((sum, i) => sum + i.quantity, 0));
const totalFen = computed(() => cart.value.reduce((sum, i) => sum + i.priceFen * i.quantity, 0));
function categoryCount(catId) {
    const list = catId
        ? dishes.value.filter((d) => d.category_id === catId)
        : dishes.value;
    const n = list.length;
    return n > 0 ? n : undefined;
}
function cartCount(dishId) {
    return cart.value.find((c) => c.dishId === dishId)?.quantity || 0;
}
function saveCart() {
    sessionStorage.setItem(cartStorageKey, JSON.stringify(cart.value));
}
function addToCart(dish) {
    const existing = cart.value.find((c) => c.dishId === dish.id);
    if (existing) {
        existing.quantity += 1;
    }
    else {
        cart.value.push({
            dishId: dish.id,
            name: dish.name,
            priceFen: dish.price_fen,
            quantity: 1,
        });
    }
    saveCart();
    showToast(`已加入 ${dish.name}`);
}
function goCheckout() {
    if (cart.value.length === 0) {
        showFailToast('购物车是空的');
        return;
    }
    router.push(`/c/${qrToken}/checkout`);
}
onMounted(async () => {
    try {
        const res = await customerApi.getMenu(qrToken);
        const data = res.data || {};
        tenantName.value = data.tenantName || '';
        deskNumber.value = data.deskNumber || '';
        deskName.value = data.deskName ?? null;
        categories.value = (data.categories || []).map((c) => ({
            id: c.id,
            name: c.name,
            sort_order: c.sort_order,
        }));
        dishes.value = (data.dishes || []).map((d) => ({
            id: d.id,
            category_id: d.category_id,
            name: d.name,
            description: d.description,
            price_fen: d.price_fen,
            image_url: d.image_url,
            available: d.available,
            stock: d.stock,
        }));
        // 恢复未结算的购物车
        const saved = sessionStorage.getItem(cartStorageKey);
        if (saved) {
            try {
                cart.value = JSON.parse(saved);
            }
            catch {
                cart.value = [];
            }
        }
    }
    catch (err) {
        showFailToast(err?.response?.data?.message || err?.message || '获取菜单失败');
    }
    finally {
        loaded.value = true;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['dish-img']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-img']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-img']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page menu-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "menu-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-info" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tenant-name" },
});
(__VLS_ctx.tenantName || '餐厅');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "desk-info" },
});
(__VLS_ctx.deskLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-tag" },
});
if (!__VLS_ctx.loaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-box" },
    });
    const __VLS_0 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    var __VLS_3;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "menu-body" },
    });
    const __VLS_4 = {}.VanSidebar;
    /** @type {[typeof __VLS_components.VanSidebar, typeof __VLS_components.vanSidebar, typeof __VLS_components.VanSidebar, typeof __VLS_components.vanSidebar, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        modelValue: (__VLS_ctx.activeCategory),
        ...{ class: "menu-sidebar" },
    }));
    const __VLS_6 = __VLS_5({
        modelValue: (__VLS_ctx.activeCategory),
        ...{ class: "menu-sidebar" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categoryList))) {
        const __VLS_8 = {}.VanSidebarItem;
        /** @type {[typeof __VLS_components.VanSidebarItem, typeof __VLS_components.vanSidebarItem, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            key: (cat.id || 'all'),
            title: (cat.name),
            badge: (__VLS_ctx.categoryCount(cat.id)),
        }));
        const __VLS_10 = __VLS_9({
            key: (cat.id || 'all'),
            title: (cat.name),
            badge: (__VLS_ctx.categoryCount(cat.id)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    }
    var __VLS_7;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "menu-content" },
    });
    if (__VLS_ctx.filteredDishes.length === 0) {
        const __VLS_12 = {}.VanEmpty;
        /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            description: "该分类暂无菜品",
            imageSize: "100",
        }));
        const __VLS_14 = __VLS_13({
            description: "该分类暂无菜品",
            imageSize: "100",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "dish-grid" },
        });
        for (const [dish] of __VLS_getVForSourceType((__VLS_ctx.filteredDishes))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (dish.id),
                ...{ class: "dish-card card" },
            });
            const __VLS_16 = {}.VanImage;
            /** @type {[typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                lazyLoad: true,
                fit: "cover",
                src: (dish.image_url || ''),
                ...{ class: "dish-img" },
            }));
            const __VLS_18 = __VLS_17({
                lazyLoad: true,
                fit: "cover",
                src: (dish.image_url || ''),
                ...{ class: "dish-img" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            __VLS_19.slots.default;
            {
                const { error: __VLS_thisSlot } = __VLS_19.slots;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "img-placeholder" },
                });
                const __VLS_20 = {}.VanIcon;
                /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
                // @ts-ignore
                const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                    name: "photo-o",
                    size: "28",
                    color: "#c8c9cc",
                }));
                const __VLS_22 = __VLS_21({
                    name: "photo-o",
                    size: "28",
                    color: "#c8c9cc",
                }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            }
            {
                const { loading: __VLS_thisSlot } = __VLS_19.slots;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "img-placeholder" },
                });
                const __VLS_24 = {}.VanIcon;
                /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
                // @ts-ignore
                const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
                    name: "photo-o",
                    size: "28",
                    color: "#c8c9cc",
                }));
                const __VLS_26 = __VLS_25({
                    name: "photo-o",
                    size: "28",
                    color: "#c8c9cc",
                }, ...__VLS_functionalComponentArgsRest(__VLS_25));
            }
            var __VLS_19;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dish-info" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dish-name" },
            });
            (dish.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dish-desc text-sm text-secondary" },
            });
            (dish.description || '美味推荐');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "dish-bottom" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "dish-price" },
            });
            (__VLS_ctx.fenToYuan(dish.price_fen));
            const __VLS_28 = {}.VanButton;
            /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                ...{ 'onClick': {} },
                type: "primary",
                size: "small",
                round: true,
                icon: (__VLS_ctx.cartCount(dish.id) > 0 ? 'plus' : undefined),
            }));
            const __VLS_30 = __VLS_29({
                ...{ 'onClick': {} },
                type: "primary",
                size: "small",
                round: true,
                icon: (__VLS_ctx.cartCount(dish.id) > 0 ? 'plus' : undefined),
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
            let __VLS_32;
            let __VLS_33;
            let __VLS_34;
            const __VLS_35 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.loaded))
                        return;
                    if (!!(__VLS_ctx.filteredDishes.length === 0))
                        return;
                    __VLS_ctx.addToCart(dish);
                }
            };
            __VLS_31.slots.default;
            (__VLS_ctx.cartCount(dish.id) > 0 ? `已选 ${__VLS_ctx.cartCount(dish.id)}` : '加入');
            var __VLS_31;
        }
    }
}
const __VLS_36 = {}.VanSubmitBar;
/** @type {[typeof __VLS_components.VanSubmitBar, typeof __VLS_components.vanSubmitBar, typeof __VLS_components.VanSubmitBar, typeof __VLS_components.vanSubmitBar, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onSubmit': {} },
    price: (__VLS_ctx.totalFen),
    buttonText: "去结算",
    disabled: (__VLS_ctx.totalCount === 0),
    tip: (__VLS_ctx.totalCount === 0 ? '请先选择菜品' : ''),
}));
const __VLS_38 = __VLS_37({
    ...{ 'onSubmit': {} },
    price: (__VLS_ctx.totalFen),
    buttonText: "去结算",
    disabled: (__VLS_ctx.totalCount === 0),
    tip: (__VLS_ctx.totalCount === 0 ? '请先选择菜品' : ''),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onSubmit: (__VLS_ctx.goCheckout)
};
__VLS_39.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "cart-summary" },
});
(__VLS_ctx.totalCount);
var __VLS_39;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-page']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-info']} */ ;
/** @type {__VLS_StyleScopedClasses['tenant-name']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-info']} */ ;
/** @type {__VLS_StyleScopedClasses['header-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-box']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-body']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-content']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-img']} */ ;
/** @type {__VLS_StyleScopedClasses['img-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['img-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-info']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-price']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-summary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanSidebar: VanSidebar,
            VanSidebarItem: VanSidebarItem,
            VanImage: VanImage,
            VanButton: VanButton,
            VanIcon: VanIcon,
            VanSubmitBar: VanSubmitBar,
            VanEmpty: VanEmpty,
            VanLoading: VanLoading,
            fenToYuan: fenToYuan,
            tenantName: tenantName,
            loaded: loaded,
            activeCategory: activeCategory,
            categoryList: categoryList,
            filteredDishes: filteredDishes,
            deskLabel: deskLabel,
            totalCount: totalCount,
            totalFen: totalFen,
            categoryCount: categoryCount,
            cartCount: cartCount,
            addToCart: addToCart,
            goCheckout: goCheckout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=MenuView.vue.js.map