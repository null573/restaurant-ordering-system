import { ref, computed, onMounted } from 'vue';
import { PullRefresh as VanPullRefresh, CellGroup as VanCellGroup, Icon as VanIcon, Tag as VanTag, Popup as VanPopup, Field as VanField, Button as VanButton, Picker as VanPicker, Empty as VanEmpty, showToast, showSuccessToast, showFailToast, showConfirmDialog, showLoadingToast, closeToast, } from 'vant';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
const auth = useAuthStore();
const isOwner = computed(() => auth.role === 'owner');
const users = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const showUserPopup = ref(false);
const submitting = ref(false);
const showRolePicker = ref(false);
const userForm = ref({
    name: '',
    phone: '',
    password: '',
    role: 'bar',
});
const roleColumns = [
    { text: '经理 (manager)', value: 'manager' },
    { text: '前台 (bar)', value: 'bar' },
    { text: '后厨 (kitchen)', value: 'kitchen' },
];
const roleLabel = computed(() => {
    const r = roleColumns.find((c) => c.value === userForm.value.role);
    return r ? r.text : '请选择角色';
});
function roleText(role) {
    switch (role) {
        case 'owner': return '店主';
        case 'manager': return '经理';
        case 'bar': return '前台';
        case 'kitchen': return '后厨';
        default: return role;
    }
}
function roleTagType(role) {
    switch (role) {
        case 'owner': return 'primary';
        case 'manager': return 'warning';
        case 'bar': return 'success';
        case 'kitchen': return 'danger';
        default: return 'primary';
    }
}
async function loadUsers() {
    loading.value = true;
    try {
        const res = await authApi.getUsers();
        users.value = (res.data || []);
    }
    catch (e) {
        showFailToast(e.message || '加载失败');
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function openAddUser() {
    if (!isOwner.value) {
        showToast('仅店主可新增店员');
        return;
    }
    userForm.value = { name: '', phone: '', password: '', role: 'bar' };
    showUserPopup.value = true;
}
function onPickRole({ selectedValues }) {
    userForm.value.role = selectedValues[0] != null ? String(selectedValues[0]) : 'bar';
    showRolePicker.value = false;
}
async function onSubmitUser() {
    if (submitting.value)
        return;
    submitting.value = true;
    showLoadingToast({ message: '创建中...', forbidClick: true, duration: 0 });
    try {
        const res = await authApi.addUser({
            phone: userForm.value.phone.trim(),
            password: userForm.value.password,
            name: userForm.value.name.trim(),
            role: userForm.value.role,
        });
        if (res.code !== 0) {
            closeToast();
            showFailToast(res.message || '新增失败');
            return;
        }
        closeToast();
        showSuccessToast('新增成功');
        showUserPopup.value = false;
        await loadUsers();
    }
    catch (e) {
        closeToast();
        showFailToast(e.message || '新增失败');
    }
    finally {
        submitting.value = false;
    }
}
async function onDeleteUser(u) {
    try {
        await showConfirmDialog({
            title: '删除店员',
            message: `确定删除店员「${u.name || u.phone}」吗？`,
        });
    }
    catch {
        return;
    }
    try {
        const res = await authApi.deleteUser(u.id);
        if (res.code === 0) {
            showSuccessToast('删除成功');
            await loadUsers();
        }
        else {
            showFailToast(res.message || '删除失败');
        }
    }
    catch (e) {
        showFailToast(e.message || '删除失败');
    }
}
onMounted(() => {
    loadUsers();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['user-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page user-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openAddUser) },
    ...{ class: "btn-gradient btn-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "user-list" },
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
    onRefresh: (__VLS_ctx.loadUsers)
};
__VLS_3.slots.default;
if (__VLS_ctx.users.length) {
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
    for (const [u] of __VLS_getVForSourceType((__VLS_ctx.users))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (u.id),
            ...{ class: "user-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "user-avatar" },
        });
        const __VLS_12 = {}.VanIcon;
        /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            name: "manager-o",
            size: "22",
            color: "var(--primary)",
        }));
        const __VLS_14 = __VLS_13({
            name: "manager-o",
            size: "22",
            color: "var(--primary)",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "user-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-between" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "user-name" },
        });
        (u.name || '未设置姓名');
        const __VLS_16 = {}.VanTag;
        /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            type: (__VLS_ctx.roleTagType(u.role)),
            size: "medium",
            round: true,
        }));
        const __VLS_18 = __VLS_17({
            type: (__VLS_ctx.roleTagType(u.role)),
            size: "medium",
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        __VLS_19.slots.default;
        (__VLS_ctx.roleText(u.role));
        var __VLS_19;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-secondary user-phone" },
        });
        (u.phone);
        if (__VLS_ctx.isOwner && u.role !== 'owner') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "user-del" },
            });
            const __VLS_20 = {}.VanIcon;
            /** @type {[typeof __VLS_components.VanIcon, typeof __VLS_components.vanIcon, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                ...{ 'onClick': {} },
                name: "delete-o",
                size: "20",
                color: "var(--danger)",
            }));
            const __VLS_22 = __VLS_21({
                ...{ 'onClick': {} },
                name: "delete-o",
                size: "20",
                color: "var(--danger)",
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            let __VLS_24;
            let __VLS_25;
            let __VLS_26;
            const __VLS_27 = {
                onClick: (...[$event]) => {
                    if (!(__VLS_ctx.users.length))
                        return;
                    if (!(__VLS_ctx.isOwner && u.role !== 'owner'))
                        return;
                    __VLS_ctx.onDeleteUser(u);
                }
            };
            var __VLS_23;
        }
        else if (u.role === 'owner') {
            const __VLS_28 = {}.VanTag;
            /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                plain: true,
                type: "primary",
                size: "medium",
            }));
            const __VLS_30 = __VLS_29({
                plain: true,
                type: "primary",
                size: "medium",
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
            __VLS_31.slots.default;
            var __VLS_31;
        }
    }
    var __VLS_11;
}
else if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-wrap" },
    });
    const __VLS_32 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        description: "暂无店员",
    }));
    const __VLS_34 = __VLS_33({
        description: "暂无店员",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
}
var __VLS_3;
if (!__VLS_ctx.isOwner) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint-bar text-sm text-secondary" },
    });
}
const __VLS_36 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    show: (__VLS_ctx.showUserPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
}));
const __VLS_38 = __VLS_37({
    show: (__VLS_ctx.showUserPopup),
    position: "bottom",
    round: true,
    closeable: true,
    closeIconPosition: "top-left",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "popup-title" },
});
const __VLS_40 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onSubmit': {} },
}));
const __VLS_42 = __VLS_41({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onSubmit: (__VLS_ctx.onSubmitUser)
};
__VLS_43.slots.default;
const __VLS_48 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    inset: true,
}));
const __VLS_50 = __VLS_49({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.userForm.name),
    label: "姓名",
    placeholder: "请输入店员姓名",
    rules: ([{ required: true, message: '请输入姓名' }]),
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.userForm.name),
    label: "姓名",
    placeholder: "请输入店员姓名",
    rules: ([{ required: true, message: '请输入姓名' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_56 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    modelValue: (__VLS_ctx.userForm.phone),
    label: "手机号",
    type: "tel",
    maxlength: "11",
    placeholder: "请输入手机号（登录账号）",
    rules: ([{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]),
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.userForm.phone),
    label: "手机号",
    type: "tel",
    maxlength: "11",
    placeholder: "请输入手机号（登录账号）",
    rules: ([{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    modelValue: (__VLS_ctx.userForm.password),
    label: "密码",
    type: "password",
    placeholder: "请设置登录密码",
    rules: ([{ required: true, message: '请设置密码' }, { pattern: /^.{6,}$/, message: '密码至少 6 位' }]),
}));
const __VLS_62 = __VLS_61({
    modelValue: (__VLS_ctx.userForm.password),
    label: "密码",
    type: "password",
    placeholder: "请设置登录密码",
    rules: ([{ required: true, message: '请设置密码' }, { pattern: /^.{6,}$/, message: '密码至少 6 位' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ 'onClick': {} },
    label: "角色",
    isLink: true,
    readonly: true,
    modelValue: (__VLS_ctx.roleLabel),
}));
const __VLS_66 = __VLS_65({
    ...{ 'onClick': {} },
    label: "角色",
    isLink: true,
    readonly: true,
    modelValue: (__VLS_ctx.roleLabel),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_68;
let __VLS_69;
let __VLS_70;
const __VLS_71 = {
    onClick: (...[$event]) => {
        __VLS_ctx.showRolePicker = true;
    }
};
var __VLS_67;
var __VLS_51;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-actions" },
});
const __VLS_72 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}));
const __VLS_74 = __VLS_73({
    block: true,
    round: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
var __VLS_75;
var __VLS_43;
var __VLS_39;
const __VLS_76 = {}.VanPopup;
/** @type {[typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, typeof __VLS_components.VanPopup, typeof __VLS_components.vanPopup, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    show: (__VLS_ctx.showRolePicker),
    position: "bottom",
    round: true,
}));
const __VLS_78 = __VLS_77({
    show: (__VLS_ctx.showRolePicker),
    position: "bottom",
    round: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.VanPicker;
/** @type {[typeof __VLS_components.VanPicker, typeof __VLS_components.vanPicker, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    columns: (__VLS_ctx.roleColumns),
}));
const __VLS_82 = __VLS_81({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    columns: (__VLS_ctx.roleColumns),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_84;
let __VLS_85;
let __VLS_86;
const __VLS_87 = {
    onConfirm: (__VLS_ctx.onPickRole)
};
const __VLS_88 = {
    onCancel: (...[$event]) => {
        __VLS_ctx.showRolePicker = false;
    }
};
var __VLS_83;
var __VLS_79;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['user-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-gradient']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['user-list']} */ ;
/** @type {__VLS_StyleScopedClasses['user-row']} */ ;
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['user-info']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['user-name']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['user-phone']} */ ;
/** @type {__VLS_StyleScopedClasses['user-del']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['hint-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['popup-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VanPullRefresh: VanPullRefresh,
            VanCellGroup: VanCellGroup,
            VanIcon: VanIcon,
            VanTag: VanTag,
            VanPopup: VanPopup,
            VanField: VanField,
            VanButton: VanButton,
            VanPicker: VanPicker,
            VanEmpty: VanEmpty,
            isOwner: isOwner,
            users: users,
            loading: loading,
            refreshing: refreshing,
            showUserPopup: showUserPopup,
            submitting: submitting,
            showRolePicker: showRolePicker,
            userForm: userForm,
            roleColumns: roleColumns,
            roleLabel: roleLabel,
            roleText: roleText,
            roleTagType: roleTagType,
            loadUsers: loadUsers,
            openAddUser: openAddUser,
            onPickRole: onPickRole,
            onSubmitUser: onSubmitUser,
            onDeleteUser: onDeleteUser,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=UserManageView.vue.js.map