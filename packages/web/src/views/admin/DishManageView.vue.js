import { ref, computed, onMounted } from 'vue';
import { Tabs as VanTabs, Tab as VanTab, PullRefresh as VanPullRefresh, Empty as VanEmpty, Image as VanImage, Icon as VanIcon, Switch as VanSwitch, Popup as VanPopup, CellGroup as VanCellGroup, Field as VanField, Button as VanButton, Uploader as VanUploader, Picker as VanPicker, showToast, showSuccessToast, showFailToast, showConfirmDialog, showLoadingToast, closeToast, } from 'vant';
import { menuApi } from '../../api';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';
const categories = ref([]);
const dishes = ref([]);
const activeTab = ref(0);
const loading = ref(false);
const refreshing = ref(false);
// 分类管理
const showCategoryPopup = ref(false);
const newCategoryName = ref('');
// 菜品弹窗
const showDishPopup = ref(false);
const editingDish = ref(null);
const submitting = ref(false);
const fileList = ref([]);
const imageFile = ref(null);
const showCategoryPicker = ref(false);
const dishForm = ref({
    name: '',
    categoryId: '',
    priceYuan: '',
    description: '',
    stock: '0',
    unlimitedStock: true,
});
const filteredDishes = computed(() => {
    if (activeTab.value === 0)
        return dishes.value;
    const cat = categories.value[activeTab.value - 1];
    if (!cat)
        return [];
    return dishes.value.filter((d) => d.category_id === cat.id);
});
const categoryLabel = computed(() => {
    const cat = categories.value.find((c) => c.id === dishForm.value.categoryId);
    return cat ? cat.name : '请选择分类';
});
const categoryPickerColumns = computed(() => [{ text: '不选分类', value: '' }, ...categories.value.map((c) => ({ text: c.name, value: c.id }))]);
function categoryName(id) {
    if (!id)
        return '未分类';
    const cat = categories.value.find((c) => c.id === id);
    return cat ? cat.name : '未分类';
}
async function loadAll() {
    loading.value = true;
    try {
        const [catRes, dishRes] = (await Promise.all([
            menuApi.getCategories(),
            menuApi.getDishes(),
        ]));
        categories.value = (catRes.data || []).map((c) => ({
            id: c.id,
            name: c.name,
            sort_order: c.sort_order,
            _editName: c.name,
        }));
        dishes.value = dishRes.data || [];
    }
    catch (e) {
        showFailToast(e.message || '加载失败');
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function onTabChange() {
    // 列表为客户端过滤，无需额外请求
}
// ===== 分类管理 =====
async function onAddCategory() {
    const name = newCategoryName.value.trim();
    if (!name) {
        showToast('请输入分类名称');
        return;
    }
    try {
        await menuApi.addCategory({ name });
        newCategoryName.value = '';
        showSuccessToast('添加成功');
        await loadAll();
    }
    catch (e) {
        showFailToast(e.message || '添加失败');
    }
}
async function onRenameCategory(cat) {
    const name = (cat._editName || '').trim();
    if (!name) {
        showToast('分类名称不能为空');
        return;
    }
    try {
        await menuApi.updateCategory(cat.id, { name });
        showSuccessToast('已保存');
        await loadAll();
    }
    catch (e) {
        showFailToast(e.message || '保存失败');
    }
}
async function onDeleteCategory(cat) {
    try {
        await showConfirmDialog({
            title: '删除分类',
            message: `确定删除分类「${cat.name}」吗？`,
        });
    }
    catch {
        return;
    }
    try {
        const res = await menuApi.deleteCategory(cat.id);
        if (res.code === 0) {
            showSuccessToast('删除成功');
            await loadAll();
        }
        else {
            showFailToast(res.message || '删除失败');
        }
    }
    catch (e) {
        showFailToast(e.message || '删除失败');
    }
}
// ===== 菜品管理 =====
function openAddDish() {
    editingDish.value = null;
    dishForm.value = {
        name: '',
        categoryId: categories.value[0]?.id || '',
        priceYuan: '',
        description: '',
        stock: '0',
        unlimitedStock: true,
    };
    fileList.value = [];
    imageFile.value = null;
    showDishPopup.value = true;
}
function openEditDish(dish) {
    editingDish.value = dish;
    dishForm.value = {
        name: dish.name,
        categoryId: dish.category_id || '',
        priceYuan: fenToYuan(dish.price_fen),
        description: dish.description || '',
        stock: dish.stock < 0 ? '0' : String(dish.stock),
        unlimitedStock: dish.stock < 0,
    };
    fileList.value = dish.image_url ? [{ url: dish.image_url }] : [];
    imageFile.value = null;
    showDishPopup.value = true;
}
function onPickCategory({ selectedValues }) {
    dishForm.value.categoryId = selectedValues[0] != null ? String(selectedValues[0]) : '';
    showCategoryPicker.value = false;
}
function onAfterRead(item) {
    imageFile.value = item.file;
}
function onOversize() {
    showFailToast('图片大小不能超过 2MB');
}
async function onSubmitDish() {
    if (submitting.value)
        return;
    submitting.value = true;
    showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
    const payload = {
        name: dishForm.value.name.trim(),
        categoryId: dishForm.value.categoryId || null,
        priceFen: yuanToFen(dishForm.value.priceYuan),
        description: dishForm.value.description.trim() || null,
        stock: dishForm.value.unlimitedStock ? -1 : parseInt(dishForm.value.stock || '0', 10),
    };
    try {
        if (editingDish.value) {
            await menuApi.updateDish(editingDish.value.id, payload);
            if (imageFile.value) {
                const upRes = await menuApi.uploadImage(editingDish.value.id, imageFile.value);
                if (upRes.code !== 0) {
                    closeToast();
                    showFailToast(upRes.message || '图片上传失败');
                    return;
                }
            }
            closeToast();
            showSuccessToast('保存成功');
        }
        else {
            const res = await menuApi.addDish(payload);
            if (res.code !== 0) {
                closeToast();
                showFailToast(res.message || '新增失败');
                return;
            }
            const newId = res.data?.id;
            if (newId && imageFile.value) {
                const upRes = await menuApi.uploadImage(newId, imageFile.value);
                if (upRes.code !== 0) {
                    closeToast();
                    showFailToast(upRes.message || '图片上传失败');
                }
            }
            closeToast();
            showSuccessToast('新增成功');
        }
        showDishPopup.value = false;
        await loadAll();
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '保存失败');
    }
    finally {
        submitting.value = false;
    }
}
async function onToggleAvailable(dish, val) {
    // 立即更新本地状态，避免开关回弹
    dish.available = val ? 1 : 0;
    try {
        await menuApi.updateDish(dish.id, { available: val });
        showToast(val ? '已上架' : '已下架');
    }
    catch (e) {
        dish.available = val ? 0 : 1; // 回滚
        showFailToast(e.message || '操作失败');
    }
}
async function onDeleteDish(dish) {
    try {
        await showConfirmDialog({
            title: '删除菜品',
            message: `确定删除「${dish.name}」吗？`,
        });
    }
    catch {
        return;
    }
    try {
        const res = await menuApi.deleteDish(dish.id);
        if (res.code === 0) {
            showSuccessToast('删除成功');
            showDishPopup.value = false;
            await loadAll();
        }
        else {
            showFailToast(res.message || '删除失败');
        }
    }
    catch (e) {
        showFailToast(e.message || '删除失败');
    }
}
function onDeleteCurrent() {
    if (editingDish.value)
        onDeleteDish(editingDish.value);
}
onMounted(() => {
    loadAll();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page dish-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex gap-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCategoryPopup = true;
        } },
    ...{ class: "btn-ghost" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openAddDish) },
    ...{ class: "btn-gradient btn-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tabs-wrap" },
});
const __VLS_0 = {}.VanTabs;
/** @type {[typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    active: (__VLS_ctx.activeTab),
    shrink: true,
    color: "var(--primary)",
    titleActiveColor: "var(--primary)",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    active: (__VLS_ctx.activeTab),
    shrink: true,
    color: "var(--primary)",
    titleActiveColor: "var(--primary)",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (__VLS_ctx.onTabChange)
};
__VLS_3.slots.default;
const __VLS_8 = {}.VanTab;
/** @type {[typeof __VLS_components.VanTab, typeof __VLS_components.vanTab, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    title: "全部",
}));
const __VLS_10 = __VLS_9({
    title: "全部",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    const __VLS_12 = {}.VanTab;
    /** @type {[typeof __VLS_components.VanTab, typeof __VLS_components.vanTab, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        key: (cat.id),
        title: (cat.name),
    }));
    const __VLS_14 = __VLS_13({
        key: (cat.id),
        title: (cat.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dish-list" },
});
const __VLS_16 = {}.VanPullRefresh;
/** @type {[typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onRefresh: (__VLS_ctx.loadAll)
};
__VLS_19.slots.default;
if (__VLS_ctx.filteredDishes.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-wrap" },
    });
    const __VLS_24 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        description: "暂无菜品，点击右上角新增",
    }));
    const __VLS_26 = __VLS_25({
        description: "暂无菜品，点击右上角新增",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
}
for (const [dish] of __VLS_getVForSourceType((__VLS_ctx.filteredDishes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openEditDish(dish);
            } },
        key: (dish.id),
        ...{ class: "dish-row card" },
    });
    const __VLS_28 = {}.VanImage;
    /** @type {[typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        round: true,
        width: "64",
        height: "64",
        fit: "cover",
        src: (dish.image_url || undefined),
        ...{ class: "dish-thumb" },
    }));
    const __VLS_30 = __VLS_29({
        round: true,
        width: "64",
        height: "64",
        fit: "cover",
        src: (dish.image_url || undefined),
        ...{ class: "dish-thumb" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    {
        const { error: __VLS_thisSlot } = __VLS_31.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "thumb-placeholder" },
        });
        const __VLS_32 = {}.VanIcon;
        /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            name: "photo-o",
            size: "22",
            color: "#c8c9cc",
        }));
        const __VLS_34 = __VLS_33({
            name: "photo-o",
            size: "22",
            color: "#c8c9cc",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
    {
        const { loading: __VLS_thisSlot } = __VLS_31.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "thumb-placeholder" },
        });
        const __VLS_36 = {}.VanIcon;
        /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            name: "photo-o",
            size: "22",
            color: "#c8c9cc",
        }));
        const __VLS_38 = __VLS_37({
            name: "photo-o",
            size: "22",
            color: "#c8c9cc",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    var __VLS_31;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dish-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "dish-name" },
    });
    (dish.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "dish-price" },
    });
    (__VLS_ctx.fenToYuan(dish.price_fen));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dish-desc text-sm text-secondary" },
    });
    (dish.description || '暂无描述');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dish-meta text-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-secondary" },
    });
    (dish.stock < 0 ? '充足' : dish.stock);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-secondary" },
    });
    (__VLS_ctx.categoryName(dish.category_id));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: "dish-actions" },
    });
    const __VLS_40 = {}.VanSwitch;
    /** @type {[typeof __VLS_components.VanSwitch, typeof __VLS_components.vanSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (!!dish.available),
        size: "22",
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (!!dish.available),
        size: "22",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_44;
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = {
        'onUpdate:modelValue': (...[$event]) => {
            __VLS_ctx.onToggleAvailable(dish, $event);
        }
    };
    var __VLS_43;
    const __VLS_48 = {}.VanIcon;
    /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ 'onClick': {} },
        name: "edit-o",
        size: "20",
        color: "var(--primary)",
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onClick': {} },
        name: "edit-o",
        size: "20",
        color: "var(--primary)",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_52;
    let __VLS_53;
    let __VLS_54;
    const __VLS_55 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openEditDish(dish);
        }
    };
    var __VLS_51;
    const __VLS_56 = {}.VanIcon;
    /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        ...{ 'onClick': {} },
        name: "delete-o",
        size: "20",
        color: "var(--danger)",
    }));
    const __VLS_58 = __VLS_57({
        ...{ 'onClick': {} },
        name: "delete-o",
        size: "20",
        color: "var(--danger)",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    let __VLS_60;
    let __VLS_61;
    let __VLS_62;
    const __VLS_63 = {
        onClick: (...[$event]) => {
            __VLS_ctx.onDeleteDish(dish);
        }
    };
    var __VLS_59;
}
var __VLS_19;
const __VLS_64 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    show: (__VLS_ctx.showCategoryPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
    ...{ style: ({ maxHeight: '80%' }) },
}));
const __VLS_66 = __VLS_65({
    show: (__VLS_ctx.showCategoryPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
    ...{ style: ({ maxHeight: '80%' }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-title" },
});
const __VLS_68 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    inset: true,
}));
const __VLS_70 = __VLS_69({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.newCategoryName),
    label: "新增分类",
    placeholder: "输入分类名称",
    clearable: true,
}));
const __VLS_74 = __VLS_73({
    modelValue: (__VLS_ctx.newCategoryName),
    label: "新增分类",
    placeholder: "输入分类名称",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
{
    const { button: __VLS_thisSlot } = __VLS_75.slots;
    const __VLS_76 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (__VLS_ctx.onAddCategory)
    };
    __VLS_79.slots.default;
    var __VLS_79;
}
var __VLS_75;
var __VLS_71;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cat-list" },
});
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (cat.id),
        ...{ class: "cat-row" },
    });
    const __VLS_84 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        modelValue: (cat._editName),
        placeholder: "分类名称",
        inputAlign: "left",
        ...{ class: "cat-field" },
    }));
    const __VLS_86 = __VLS_85({
        modelValue: (cat._editName),
        placeholder: "分类名称",
        inputAlign: "left",
        ...{ class: "cat-field" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    const __VLS_88 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        ...{ 'onClick': {} },
        size: "small",
        plain: true,
        type: "primary",
    }));
    const __VLS_90 = __VLS_89({
        ...{ 'onClick': {} },
        size: "small",
        plain: true,
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    let __VLS_92;
    let __VLS_93;
    let __VLS_94;
    const __VLS_95 = {
        onClick: (...[$event]) => {
            __VLS_ctx.onRenameCategory(cat);
        }
    };
    __VLS_91.slots.default;
    var __VLS_91;
    const __VLS_96 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        ...{ 'onClick': {} },
        size: "small",
        plain: true,
        type: "danger",
    }));
    const __VLS_98 = __VLS_97({
        ...{ 'onClick': {} },
        size: "small",
        plain: true,
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    let __VLS_100;
    let __VLS_101;
    let __VLS_102;
    const __VLS_103 = {
        onClick: (...[$event]) => {
            __VLS_ctx.onDeleteCategory(cat);
        }
    };
    __VLS_99.slots.default;
    var __VLS_99;
}
if (__VLS_ctx.categories.length === 0) {
    const __VLS_104 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        description: "暂无分类",
        imageSize: "80",
    }));
    const __VLS_106 = __VLS_105({
        description: "暂无分类",
        imageSize: "80",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
}
var __VLS_67;
const __VLS_108 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    show: (__VLS_ctx.showDishPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
    ...{ style: ({ maxHeight: '90%' }) },
}));
const __VLS_110 = __VLS_109({
    show: (__VLS_ctx.showDishPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
    ...{ style: ({ maxHeight: '90%' }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-title" },
});
(__VLS_ctx.editingDish ? '编辑菜品' : '新增菜品');
const __VLS_112 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    ...{ 'onSubmit': {} },
}));
const __VLS_114 = __VLS_113({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
let __VLS_116;
let __VLS_117;
let __VLS_118;
const __VLS_119 = {
    onSubmit: (__VLS_ctx.onSubmitDish)
};
__VLS_115.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-block" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-label" },
});
const __VLS_120 = {}.VanUploader;
/** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    ...{ 'onOversize': {} },
    modelValue: (__VLS_ctx.fileList),
    maxCount: (1),
    maxSize: (2 * 1024 * 1024),
    accept: "image/jpeg,image/png,image/webp,image/gif",
    afterRead: (__VLS_ctx.onAfterRead),
}));
const __VLS_122 = __VLS_121({
    ...{ 'onOversize': {} },
    modelValue: (__VLS_ctx.fileList),
    maxCount: (1),
    maxSize: (2 * 1024 * 1024),
    accept: "image/jpeg,image/png,image/webp,image/gif",
    afterRead: (__VLS_ctx.onAfterRead),
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
let __VLS_124;
let __VLS_125;
let __VLS_126;
const __VLS_127 = {
    onOversize: (__VLS_ctx.onOversize)
};
var __VLS_123;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-secondary mt-sm" },
});
const __VLS_128 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    inset: true,
}));
const __VLS_130 = __VLS_129({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
const __VLS_132 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    modelValue: (__VLS_ctx.dishForm.name),
    label: "名称",
    placeholder: "请输入菜品名称",
    rules: ([{ required: true, message: '请输入菜品名称' }]),
}));
const __VLS_134 = __VLS_133({
    modelValue: (__VLS_ctx.dishForm.name),
    label: "名称",
    placeholder: "请输入菜品名称",
    rules: ([{ required: true, message: '请输入菜品名称' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
const __VLS_136 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    ...{ 'onClick': {} },
    label: "分类",
    isLink: true,
    readonly: true,
    modelValue: (__VLS_ctx.categoryLabel),
}));
const __VLS_138 = __VLS_137({
    ...{ 'onClick': {} },
    label: "分类",
    isLink: true,
    readonly: true,
    modelValue: (__VLS_ctx.categoryLabel),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
let __VLS_140;
let __VLS_141;
let __VLS_142;
const __VLS_143 = {
    onClick: (...[$event]) => {
        __VLS_ctx.showCategoryPicker = true;
    }
};
var __VLS_139;
const __VLS_144 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    modelValue: (__VLS_ctx.dishForm.priceYuan),
    label: "价格(元)",
    type: "number",
    placeholder: "如 12.50",
    rules: ([{ required: true, message: '请输入价格' }]),
}));
const __VLS_146 = __VLS_145({
    modelValue: (__VLS_ctx.dishForm.priceYuan),
    label: "价格(元)",
    type: "number",
    placeholder: "如 12.50",
    rules: ([{ required: true, message: '请输入价格' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
const __VLS_148 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    modelValue: (__VLS_ctx.dishForm.description),
    label: "描述",
    type: "textarea",
    rows: "2",
    autosize: true,
    placeholder: "菜品描述（可选）",
}));
const __VLS_150 = __VLS_149({
    modelValue: (__VLS_ctx.dishForm.description),
    label: "描述",
    type: "textarea",
    rows: "2",
    autosize: true,
    placeholder: "菜品描述（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
const __VLS_152 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    label: "无限库存",
}));
const __VLS_154 = __VLS_153({
    label: "无限库存",
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
__VLS_155.slots.default;
{
    const { input: __VLS_thisSlot } = __VLS_155.slots;
    const __VLS_156 = {}.VanSwitch;
    /** @type {[typeof __VLS_components.VanSwitch, typeof __VLS_components.vanSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        modelValue: (__VLS_ctx.dishForm.unlimitedStock),
        size: "22",
    }));
    const __VLS_158 = __VLS_157({
        modelValue: (__VLS_ctx.dishForm.unlimitedStock),
        size: "22",
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
}
var __VLS_155;
if (!__VLS_ctx.dishForm.unlimitedStock) {
    const __VLS_160 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
        modelValue: (__VLS_ctx.dishForm.stock),
        label: "库存",
        type: "digit",
        placeholder: "请输入库存数量",
    }));
    const __VLS_162 = __VLS_161({
        modelValue: (__VLS_ctx.dishForm.stock),
        label: "库存",
        type: "digit",
        placeholder: "请输入库存数量",
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
}
var __VLS_131;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-actions" },
});
const __VLS_164 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}));
const __VLS_166 = __VLS_165({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
(__VLS_ctx.editingDish ? '保存修改' : '新增菜品');
var __VLS_167;
if (__VLS_ctx.editingDish) {
    const __VLS_168 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        plain: true,
        type: "danger",
    }));
    const __VLS_170 = __VLS_169({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        plain: true,
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_169));
    let __VLS_172;
    let __VLS_173;
    let __VLS_174;
    const __VLS_175 = {
        onClick: (__VLS_ctx.onDeleteCurrent)
    };
    __VLS_171.slots.default;
    var __VLS_171;
}
var __VLS_115;
var __VLS_111;
const __VLS_176 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    show: (__VLS_ctx.showCategoryPicker),
    position: "bottom",
    round: true,
}));
const __VLS_178 = __VLS_177({
    show: (__VLS_ctx.showCategoryPicker),
    position: "bottom",
    round: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
__VLS_179.slots.default;
const __VLS_180 = {}.VanPicker;
/** @type {[typeof __VLS_components.VanPicker, typeof __VLS_components.vanPicker, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    columns: (__VLS_ctx.categoryPickerColumns),
}));
const __VLS_182 = __VLS_181({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    columns: (__VLS_ctx.categoryPickerColumns),
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
let __VLS_184;
let __VLS_185;
let __VLS_186;
const __VLS_187 = {
    onConfirm: (__VLS_ctx.onPickCategory)
};
const __VLS_188 = {
    onCancel: (...[$event]) => {
        __VLS_ctx.showCategoryPicker = false;
    }
};
var __VLS_183;
var __VLS_179;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-list']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['thumb-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['thumb-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-info']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-price']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['dish-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-title']} */ ;
/** @type {__VLS_StyleScopedClasses['cat-list']} */ ;
/** @type {__VLS_StyleScopedClasses['cat-row']} */ ;
/** @type {__VLS_StyleScopedClasses['cat-field']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-block']} */ ;
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanTabs: VanTabs,
            VanTab: VanTab,
            VanPullRefresh: VanPullRefresh,
            VanEmpty: VanEmpty,
            VanImage: VanImage,
            VanIcon: VanIcon,
            VanSwitch: VanSwitch,
            VanPopup: VanPopup,
            VanCellGroup: VanCellGroup,
            VanField: VanField,
            VanButton: VanButton,
            VanUploader: VanUploader,
            VanPicker: VanPicker,
            fenToYuan: fenToYuan,
            categories: categories,
            activeTab: activeTab,
            loading: loading,
            refreshing: refreshing,
            showCategoryPopup: showCategoryPopup,
            newCategoryName: newCategoryName,
            showDishPopup: showDishPopup,
            editingDish: editingDish,
            submitting: submitting,
            fileList: fileList,
            showCategoryPicker: showCategoryPicker,
            dishForm: dishForm,
            filteredDishes: filteredDishes,
            categoryLabel: categoryLabel,
            categoryPickerColumns: categoryPickerColumns,
            categoryName: categoryName,
            loadAll: loadAll,
            onTabChange: onTabChange,
            onAddCategory: onAddCategory,
            onRenameCategory: onRenameCategory,
            onDeleteCategory: onDeleteCategory,
            openAddDish: openAddDish,
            openEditDish: openEditDish,
            onPickCategory: onPickCategory,
            onAfterRead: onAfterRead,
            onOversize: onOversize,
            onSubmitDish: onSubmitDish,
            onToggleAvailable: onToggleAvailable,
            onDeleteDish: onDeleteDish,
            onDeleteCurrent: onDeleteCurrent,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=DishManageView.vue.js.map