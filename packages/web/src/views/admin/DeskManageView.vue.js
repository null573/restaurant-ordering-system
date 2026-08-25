import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { PullRefresh as VanPullRefresh, Empty as VanEmpty, CellGroup as VanCellGroup, Tag as VanTag, Icon as VanIcon, Popup as VanPopup, Field as VanField, Button as VanButton, Stepper as VanStepper, showToast, showSuccessToast, showFailToast, showConfirmDialog, showLoadingToast, closeToast, } from 'vant';
import { deskApi } from '../../api';
const router = useRouter();
const desks = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const showDeskPopup = ref(false);
const showBatchPopup = ref(false);
const editingDesk = ref(null);
const submitting = ref(false);
const deskForm = ref({
    number: '',
    name: '',
    capacity: 4,
});
const batchForm = ref({
    prefix: 'A',
    start: '1',
    count: '10',
    capacity: 4,
});
const batchPreview = computed(() => {
    const { prefix, start, count } = batchForm.value;
    const s = parseInt(start, 10);
    const c = parseInt(count, 10);
    if (!prefix || !s || !c)
        return '请填写完整';
    if (c <= 2)
        return [prefix + s, prefix + (s + 1)].join('、');
    return `${prefix}${s}、${prefix}${s + 1} ... ${prefix}${s + c - 1}`;
});
function statusText(status) {
    switch (status) {
        case 'idle': return '空闲';
        case 'occupied': return '使用中';
        case 'paying': return '结账中';
        default: return status;
    }
}
async function loadDesks() {
    loading.value = true;
    try {
        const res = await deskApi.list();
        desks.value = res.data || [];
    }
    catch (e) {
        showFailToast(e.message || '加载失败');
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function goQRCodes() {
    router.push('/admin/qrcodes');
}
function openAddDesk() {
    editingDesk.value = null;
    deskForm.value = { number: '', name: '', capacity: 4 };
    showDeskPopup.value = true;
}
function openEditDesk(desk) {
    editingDesk.value = desk;
    deskForm.value = {
        number: desk.number,
        name: desk.name || '',
        capacity: desk.capacity,
    };
    showDeskPopup.value = true;
}
async function onSubmitDesk() {
    if (submitting.value)
        return;
    submitting.value = true;
    showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
    try {
        const payload = {
            number: deskForm.value.number.trim(),
            name: deskForm.value.name.trim() || undefined,
            capacity: deskForm.value.capacity,
        };
        if (editingDesk.value) {
            const res = await deskApi.update(editingDesk.value.id, payload);
            if (res.code !== 0) {
                closeToast();
                showFailToast(res.message || '保存失败');
                return;
            }
        }
        else {
            const res = await deskApi.add(payload);
            if (res.code !== 0) {
                closeToast();
                showFailToast(res.message || '新增失败');
                return;
            }
        }
        closeToast();
        showSuccessToast('保存成功');
        showDeskPopup.value = false;
        await loadDesks();
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '保存失败');
    }
    finally {
        submitting.value = false;
    }
}
async function onSubmitBatch() {
    const prefix = batchForm.value.prefix.trim();
    const start = parseInt(batchForm.value.start, 10);
    const count = parseInt(batchForm.value.count, 10);
    if (!prefix || !start || !count) {
        showToast('请填写完整');
        return;
    }
    if (count > 200) {
        showFailToast('单次最多创建 200 个');
        return;
    }
    if (submitting.value)
        return;
    submitting.value = true;
    showLoadingToast({ message: '创建中...', forbidClick: true, duration: 0 });
    try {
        const res = await deskApi.batch({
            prefix,
            start,
            count,
            capacity: batchForm.value.capacity,
        });
        if (res.code !== 0) {
            closeToast();
            showFailToast(res.message || '批量创建失败');
            return;
        }
        closeToast();
        showSuccessToast(`成功创建 ${count} 个桌位`);
        showBatchPopup.value = false;
        await loadDesks();
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '批量创建失败');
    }
    finally {
        submitting.value = false;
    }
}
async function onDeleteDesk(desk) {
    try {
        await showConfirmDialog({
            title: '删除桌位',
            message: `确定删除桌位「${desk.number}」吗？`,
        });
    }
    catch {
        return;
    }
    try {
        const res = await deskApi.remove(desk.id);
        if (res.code === 0) {
            showSuccessToast('删除成功');
            showDeskPopup.value = false;
            await loadDesks();
        }
        else {
            showFailToast(res.message || '删除失败');
        }
    }
    catch (e) {
        showFailToast(e.message || '删除失败');
    }
}
function onDeleteCurrentDesk() {
    if (editingDesk.value)
        onDeleteDesk(editingDesk.value);
}
onMounted(() => {
    loadDesks();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['desk-row']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-entry']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page desk-page" },
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
            __VLS_ctx.showBatchPopup = true;
        } },
    ...{ class: "btn-ghost" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openAddDesk) },
    ...{ class: "btn-gradient btn-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "desk-list" },
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
    onRefresh: (__VLS_ctx.loadDesks)
};
__VLS_3.slots.default;
if (__VLS_ctx.desks.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-wrap" },
    });
    const __VLS_8 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        description: "暂无桌位，点击右上角新增",
    }));
    const __VLS_10 = __VLS_9({
        description: "暂无桌位，点击右上角新增",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
if (__VLS_ctx.desks.length) {
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
    for (const [desk] of __VLS_getVForSourceType((__VLS_ctx.desks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (desk.id),
            ...{ class: "desk-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-no" },
        });
        (desk.number);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-name" },
        });
        (desk.name || `桌位 ${desk.number}`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-secondary" },
        });
        (desk.capacity);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "desk-actions" },
        });
        const __VLS_16 = {}.VanTag;
        /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            plain: true,
            type: "success",
            size: "medium",
        }));
        const __VLS_18 = __VLS_17({
            plain: true,
            type: "success",
            size: "medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        __VLS_19.slots.default;
        (__VLS_ctx.statusText(desk.status));
        var __VLS_19;
        const __VLS_20 = {}.VanIcon;
        /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ 'onClick': {} },
            name: "scan",
            size: "22",
            color: "var(--primary)",
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onClick': {} },
            name: "scan",
            size: "22",
            color: "var(--primary)",
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onClick: (__VLS_ctx.goQRCodes)
        };
        var __VLS_23;
        const __VLS_28 = {}.VanIcon;
        /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            name: "edit-o",
            size: "20",
            color: "var(--primary)",
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            name: "edit-o",
            size: "20",
            color: "var(--primary)",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.desks.length))
                    return;
                __VLS_ctx.openEditDesk(desk);
            }
        };
        var __VLS_31;
        const __VLS_36 = {}.VanIcon;
        /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
            name: "delete-o",
            size: "20",
            color: "var(--danger)",
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
            name: "delete-o",
            size: "20",
            color: "var(--danger)",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_40;
        let __VLS_41;
        let __VLS_42;
        const __VLS_43 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.desks.length))
                    return;
                __VLS_ctx.onDeleteDesk(desk);
            }
        };
        var __VLS_39;
    }
    var __VLS_15;
}
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.goQRCodes) },
    ...{ class: "qr-entry" },
});
const __VLS_44 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    name: "scan",
    size: "22",
    color: "var(--primary)",
}));
const __VLS_46 = __VLS_45({
    name: "scan",
    size: "22",
    color: "var(--primary)",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
const __VLS_48 = {}.VanIcon;
/** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    name: "arrow",
    size: "14",
    color: "var(--text-secondary)",
}));
const __VLS_50 = __VLS_49({
    name: "arrow",
    size: "14",
    color: "var(--text-secondary)",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    show: (__VLS_ctx.showDeskPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
}));
const __VLS_54 = __VLS_53({
    show: (__VLS_ctx.showDeskPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-title" },
});
(__VLS_ctx.editingDesk ? '编辑桌位' : '新增桌位');
const __VLS_56 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    ...{ 'onSubmit': {} },
}));
const __VLS_58 = __VLS_57({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
let __VLS_60;
let __VLS_61;
let __VLS_62;
const __VLS_63 = {
    onSubmit: (__VLS_ctx.onSubmitDesk)
};
__VLS_59.slots.default;
const __VLS_64 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    inset: true,
}));
const __VLS_66 = __VLS_65({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.deskForm.number),
    label: "桌号",
    placeholder: "如 A1",
    rules: ([{ required: true, message: '请输入桌号' }]),
}));
const __VLS_70 = __VLS_69({
    modelValue: (__VLS_ctx.deskForm.number),
    label: "桌号",
    placeholder: "如 A1",
    rules: ([{ required: true, message: '请输入桌号' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.deskForm.name),
    label: "名称",
    placeholder: "如 大厅A1（可选）",
}));
const __VLS_74 = __VLS_73({
    modelValue: (__VLS_ctx.deskForm.name),
    label: "名称",
    placeholder: "如 大厅A1（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
const __VLS_76 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: "容量",
    modelValue: (`${__VLS_ctx.deskForm.capacity} 人`),
}));
const __VLS_78 = __VLS_77({
    label: "容量",
    modelValue: (`${__VLS_ctx.deskForm.capacity} 人`),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
{
    const { input: __VLS_thisSlot } = __VLS_79.slots;
    const __VLS_80 = {}.VanStepper;
    /** @type {[typeof __VLS_components.VanStepper, typeof __VLS_components.vanStepper, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        modelValue: (__VLS_ctx.deskForm.capacity),
        min: "1",
        max: "50",
    }));
    const __VLS_82 = __VLS_81({
        modelValue: (__VLS_ctx.deskForm.capacity),
        min: "1",
        max: "50",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
}
var __VLS_79;
var __VLS_67;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-actions" },
});
const __VLS_84 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}));
const __VLS_86 = __VLS_85({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
(__VLS_ctx.editingDesk ? '保存修改' : '新增');
var __VLS_87;
if (__VLS_ctx.editingDesk) {
    const __VLS_88 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        plain: true,
        type: "danger",
    }));
    const __VLS_90 = __VLS_89({
        ...{ 'onClick': {} },
        block: true,
        round: true,
        plain: true,
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    let __VLS_92;
    let __VLS_93;
    let __VLS_94;
    const __VLS_95 = {
        onClick: (__VLS_ctx.onDeleteCurrentDesk)
    };
    __VLS_91.slots.default;
    var __VLS_91;
}
var __VLS_59;
var __VLS_55;
const __VLS_96 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    show: (__VLS_ctx.showBatchPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
}));
const __VLS_98 = __VLS_97({
    show: (__VLS_ctx.showBatchPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-title" },
});
const __VLS_100 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    ...{ 'onSubmit': {} },
}));
const __VLS_102 = __VLS_101({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
let __VLS_104;
let __VLS_105;
let __VLS_106;
const __VLS_107 = {
    onSubmit: (__VLS_ctx.onSubmitBatch)
};
__VLS_103.slots.default;
const __VLS_108 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    inset: true,
}));
const __VLS_110 = __VLS_109({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
const __VLS_112 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    modelValue: (__VLS_ctx.batchForm.prefix),
    label: "前缀",
    placeholder: "如 A",
    rules: ([{ required: true, message: '请输入前缀' }]),
}));
const __VLS_114 = __VLS_113({
    modelValue: (__VLS_ctx.batchForm.prefix),
    label: "前缀",
    placeholder: "如 A",
    rules: ([{ required: true, message: '请输入前缀' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
const __VLS_116 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    modelValue: (__VLS_ctx.batchForm.start),
    label: "起始号",
    type: "digit",
    placeholder: "如 1",
    rules: ([{ required: true, message: '请输入起始号' }]),
}));
const __VLS_118 = __VLS_117({
    modelValue: (__VLS_ctx.batchForm.start),
    label: "起始号",
    type: "digit",
    placeholder: "如 1",
    rules: ([{ required: true, message: '请输入起始号' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
const __VLS_120 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    modelValue: (__VLS_ctx.batchForm.count),
    label: "数量",
    type: "digit",
    placeholder: "如 10",
    rules: ([{ required: true, message: '请输入数量' }]),
}));
const __VLS_122 = __VLS_121({
    modelValue: (__VLS_ctx.batchForm.count),
    label: "数量",
    type: "digit",
    placeholder: "如 10",
    rules: ([{ required: true, message: '请输入数量' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
const __VLS_124 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    label: "容量",
    modelValue: (`${__VLS_ctx.batchForm.capacity} 人`),
}));
const __VLS_126 = __VLS_125({
    label: "容量",
    modelValue: (`${__VLS_ctx.batchForm.capacity} 人`),
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
__VLS_127.slots.default;
{
    const { input: __VLS_thisSlot } = __VLS_127.slots;
    const __VLS_128 = {}.VanStepper;
    /** @type {[typeof __VLS_components.VanStepper, typeof __VLS_components.vanStepper, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        modelValue: (__VLS_ctx.batchForm.capacity),
        min: "1",
        max: "50",
    }));
    const __VLS_130 = __VLS_129({
        modelValue: (__VLS_ctx.batchForm.capacity),
        min: "1",
        max: "50",
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
}
var __VLS_127;
var __VLS_111;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "batch-preview text-sm text-secondary" },
});
(__VLS_ctx.batchPreview);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-actions" },
});
const __VLS_132 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}));
const __VLS_134 = __VLS_133({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
__VLS_135.slots.default;
var __VLS_135;
var __VLS_103;
var __VLS_99;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-list']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-row']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-no']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-info']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-name']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['desk-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-entry']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-title']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanPullRefresh: VanPullRefresh,
            VanEmpty: VanEmpty,
            VanCellGroup: VanCellGroup,
            VanTag: VanTag,
            VanIcon: VanIcon,
            VanPopup: VanPopup,
            VanField: VanField,
            VanButton: VanButton,
            VanStepper: VanStepper,
            desks: desks,
            loading: loading,
            refreshing: refreshing,
            showDeskPopup: showDeskPopup,
            showBatchPopup: showBatchPopup,
            editingDesk: editingDesk,
            submitting: submitting,
            deskForm: deskForm,
            batchForm: batchForm,
            batchPreview: batchPreview,
            statusText: statusText,
            loadDesks: loadDesks,
            goQRCodes: goQRCodes,
            openAddDesk: openAddDesk,
            openEditDesk: openEditDesk,
            onSubmitDesk: onSubmitDesk,
            onSubmitBatch: onSubmitBatch,
            onDeleteDesk: onDeleteDesk,
            onDeleteCurrentDesk: onDeleteCurrentDesk,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=DeskManageView.vue.js.map