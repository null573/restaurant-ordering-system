import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../../api';
import { fenToYuan, yuanToFen } from '../../utils/qrcode';
import { NavBar as VanNavBar, Cell as VanCell, CellGroup as VanCellGroup, Field as VanField, Button as VanButton, Tag as VanTag, Loading as VanLoading, Empty as VanEmpty, showSuccessToast, showToast, } from 'vant';
const route = useRoute();
const router = useRouter();
// 路由参数 :orderId 实际为 deskId（从桌位状态页跳转时传入）
const deskId = String(route.params.orderId || '');
const order = ref(null); // 活跃订单（列表项）
const detail = ref(null); // 订单详情（含 items）
const loading = ref(true);
const submitting = ref(false);
const paidInput = ref(''); // 实付金额（元）
const totalFen = computed(() => Number(detail.value?.total_fen ?? order.value?.total_fen ?? 0));
const paidFen = computed(() => (paidInput.value === '' ? 0 : yuanToFen(paidInput.value)));
const changeFen = computed(() => Math.max(0, paidFen.value - totalFen.value));
const totalYuan = computed(() => fenToYuan(totalFen.value));
const changeYuan = computed(() => fenToYuan(changeFen.value));
// 微信是否已支付（order.status === 'paid' && pay_method === 'wechat'）
const wechatPaid = computed(() => {
    const o = detail.value || order.value;
    return !!o && o.pay_method === 'wechat' && o.status === 'paid';
});
// 查找该桌的活跃订单
async function loadOrder() {
    loading.value = true;
    try {
        // 优先查待支付订单
        let res = await orderApi.list({ deskId, status: 'pending' });
        let list = res.data || [];
        if (!list.length) {
            // 无待支付订单，回退查找该桌任意未结订单（如已微信支付待打印）
            res = await orderApi.list({ deskId });
            list = (res.data || []).filter((o) => ['pending', 'paid', 'cooking', 'served'].includes(o.status));
        }
        const active = list[0];
        if (!active) {
            order.value = null;
            detail.value = null;
            return;
        }
        order.value = active;
        const d = await orderApi.detail(active.id);
        detail.value = d.data;
    }
    catch {
        showToast('订单加载失败');
    }
    finally {
        loading.value = false;
    }
}
// 现金结账
async function onCashSettle() {
    if (!order.value)
        return;
    if (paidFen.value < totalFen.value) {
        showToast('实付金额不足');
        return;
    }
    try {
        submitting.value = true;
        const res = await orderApi.barCash({
            orderId: order.value.id,
            paidFen: paidFen.value,
        });
        showSuccessToast(res.message || '现金结账成功');
        setTimeout(() => router.push('/bar'), 800);
    }
    catch (e) {
        showToast(e?.response?.data?.message || '结账失败');
    }
    finally {
        submitting.value = false;
    }
}
// 打印结算单：先获取结算单数据，再 window.print 打印
async function onPrint() {
    if (!order.value)
        return;
    try {
        const res = await orderApi.receipt(order.value.id);
        const receipt = res.data;
        if (!receipt) {
            showToast('无结算单数据');
            return;
        }
        printReceipt(receipt);
    }
    catch {
        showToast('获取结算单失败');
    }
}
function printReceipt(r) {
    const html = buildReceiptHtml(r);
    const win = window.open('', '_blank', 'width=380,height=640');
    if (!win) {
        showToast('请允许弹出窗口以打印');
        return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
}
function buildReceiptHtml(r) {
    const items = (r.items || [])
        .map((it) => `
      <tr>
        <td class="l">${escapeHtml(it.name)}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">¥${fenToYuan(it.priceFen)}</td>
        <td class="r">¥${fenToYuan(it.subtotalFen)}</td>
      </tr>`)
        .join('');
    const payText = r.payMethod === 'cash' ? '现金' : r.payMethod === 'wechat' ? '微信' : '—';
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>结算单</title>
<style>
  body { font-family: 'PingFang SC', sans-serif; padding: 12px; font-size: 12px; color: #323233; }
  h2 { text-align: center; margin: 4px 0; }
  .sub { text-align: center; color: #969799; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4px 2px; border-bottom: 1px dashed #ebedf0; text-align: left; }
  th { color: #969799; font-weight: 500; }
  .c { text-align: center; }
  .r { text-align: right; }
  .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 8px; color: #ee0a24; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
</style></head>
<body>
  <h2>结算单</h2>
  <div class="sub">单号 ${escapeHtml(r.orderNo || '')} · 桌号 ${escapeHtml(r.deskNumber || '')}</div>
  <table>
    <thead><tr><th>菜品</th><th class="c">数量</th><th class="r">单价</th><th class="r">小计</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total"><span>合计</span><span>¥${fenToYuan(r.totalFen)}</span></div>
  <div class="row"><span>支付方式</span><span>${payText}</span></div>
  <div class="row"><span>实付</span><span>¥${fenToYuan(r.paidFen)}</span></div>
  <div class="row"><span>找零</span><span>¥${fenToYuan(r.changeFen)}</span></div>
  <div class="sub" style="margin-top:12px;">谢谢惠顾</div>
</body></html>`;
}
function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"]/g, (c) => c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;');
}
function statusText(s) {
    const m = {
        pending: '待支付',
        paid: '已支付',
        cooking: '制作中',
        served: '已上菜',
        closed: '已结账',
        cancelled: '已取消',
    };
    return m[s] || s;
}
function statusTagType(s) {
    if (s === 'paid')
        return 'success';
    if (s === 'pending')
        return 'warning';
    if (s === 'closed' || s === 'cancelled')
        return 'default';
    return 'primary';
}
onMounted(loadOrder);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['change-row']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['change-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['wechat-status']} */ ;
/** @type {__VLS_StyleScopedClasses['wechat-status']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "settlement page" },
});
const __VLS_0 = {}.VanNavBar;
/** @type {[typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClickLeft': {} },
    title: "结算",
    leftArrow: true,
    fixed: true,
    placeholder: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "结算",
    leftArrow: true,
    fixed: true,
    placeholder: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClickLeft: (...[$event]) => {
        __VLS_ctx.router.back();
    }
};
var __VLS_3;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-box" },
    });
    const __VLS_8 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    var __VLS_11;
}
else if (!__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-box" },
    });
    const __VLS_12 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        description: "该桌暂无待结算订单",
    }));
    const __VLS_14 = __VLS_13({
        description: "该桌暂无待结算订单",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const __VLS_16 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        plain: true,
        block: true,
        ...{ class: "back-btn" },
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        plain: true,
        block: true,
        ...{ class: "back-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.loading))
                return;
            if (!(!__VLS_ctx.order))
                return;
            __VLS_ctx.router.push('/bar');
        }
    };
    __VLS_19.slots.default;
    var __VLS_19;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "settle-body" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-card card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "value" },
    });
    (__VLS_ctx.detail?.desk_number || __VLS_ctx.order.desk_number);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "value" },
    });
    (__VLS_ctx.detail?.order_no || __VLS_ctx.order.order_no);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "label" },
    });
    const __VLS_24 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.detail?.status || __VLS_ctx.order.status)),
    }));
    const __VLS_26 = __VLS_25({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.detail?.status || __VLS_ctx.order.status)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    (__VLS_ctx.statusText(__VLS_ctx.detail?.status || __VLS_ctx.order.status));
    var __VLS_27;
    const __VLS_28 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        title: "订单明细",
        inset: true,
    }));
    const __VLS_30 = __VLS_29({
        title: "订单明细",
        inset: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    for (const [item] of __VLS_getVForSourceType(((__VLS_ctx.detail?.items || [])))) {
        const __VLS_32 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            key: (item.id),
        }));
        const __VLS_34 = __VLS_33({
            key: (item.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        __VLS_35.slots.default;
        {
            const { title: __VLS_thisSlot } = __VLS_35.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "item-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "item-name" },
            });
            (item.dish_name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "item-qty" },
            });
            (item.quantity);
            if (item.remark) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "item-remark" },
                });
                (item.remark);
            }
        }
        {
            const { value: __VLS_thisSlot } = __VLS_35.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "item-price" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "price-unit" },
            });
            (__VLS_ctx.fenToYuan(item.price_fen));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "price-sub" },
            });
            (__VLS_ctx.fenToYuan(item.price_fen * item.quantity));
        }
        var __VLS_35;
    }
    if (!(__VLS_ctx.detail?.items?.length)) {
        const __VLS_36 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            title: "暂无明细",
        }));
        const __VLS_38 = __VLS_37({
            title: "暂无明细",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    var __VLS_31;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "total-card card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "total-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "total-amount" },
    });
    (__VLS_ctx.totalYuan);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "cash-box card" },
    });
    const __VLS_40 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.paidInput),
        type: "number",
        label: "实付金额",
        placeholder: "请输入实付金额",
        inputAlign: "right",
    }));
    const __VLS_42 = __VLS_41({
        modelValue: (__VLS_ctx.paidInput),
        type: "number",
        label: "实付金额",
        placeholder: "请输入实付金额",
        inputAlign: "right",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    {
        const { button: __VLS_thisSlot } = __VLS_43.slots;
    }
    var __VLS_43;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "change-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "change-amount" },
        ...{ class: ({ disabled: __VLS_ctx.changeFen <= 0 }) },
    });
    (__VLS_ctx.changeYuan);
    const __VLS_44 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        type: "primary",
        block: true,
        ...{ class: "cash-btn" },
        disabled: (__VLS_ctx.submitting || __VLS_ctx.paidFen < __VLS_ctx.totalFen),
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        type: "primary",
        block: true,
        ...{ class: "cash-btn" },
        disabled: (__VLS_ctx.submitting || __VLS_ctx.paidFen < __VLS_ctx.totalFen),
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (__VLS_ctx.onCashSettle)
    };
    __VLS_47.slots.default;
    var __VLS_47;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "wechat-box card" },
    });
    if (__VLS_ctx.wechatPaid) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wechat-status success" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wechat-status waiting" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "action-bar" },
    });
    const __VLS_52 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        ...{ 'onClick': {} },
        plain: true,
        block: true,
    }));
    const __VLS_54 = __VLS_53({
        ...{ 'onClick': {} },
        plain: true,
        block: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    let __VLS_56;
    let __VLS_57;
    let __VLS_58;
    const __VLS_59 = {
        onClick: (__VLS_ctx.onPrint)
    };
    __VLS_55.slots.default;
    var __VLS_55;
}
/** @type {__VLS_StyleScopedClasses['settlement']} */ ;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-box']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-box']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['settle-body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['item-row']} */ ;
/** @type {__VLS_StyleScopedClasses['item-name']} */ ;
/** @type {__VLS_StyleScopedClasses['item-qty']} */ ;
/** @type {__VLS_StyleScopedClasses['item-remark']} */ ;
/** @type {__VLS_StyleScopedClasses['item-price']} */ ;
/** @type {__VLS_StyleScopedClasses['price-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['price-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['total-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['total-label']} */ ;
/** @type {__VLS_StyleScopedClasses['total-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['cash-box']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['change-row']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['change-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['cash-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['wechat-box']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['wechat-status']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['wechat-status']} */ ;
/** @type {__VLS_StyleScopedClasses['waiting']} */ ;
/** @type {__VLS_StyleScopedClasses['action-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            fenToYuan: fenToYuan,
            VanNavBar: VanNavBar,
            VanCell: VanCell,
            VanCellGroup: VanCellGroup,
            VanField: VanField,
            VanButton: VanButton,
            VanTag: VanTag,
            VanLoading: VanLoading,
            VanEmpty: VanEmpty,
            router: router,
            order: order,
            detail: detail,
            loading: loading,
            submitting: submitting,
            paidInput: paidInput,
            totalFen: totalFen,
            paidFen: paidFen,
            changeFen: changeFen,
            totalYuan: totalYuan,
            changeYuan: changeYuan,
            wechatPaid: wechatPaid,
            onCashSettle: onCashSettle,
            onPrint: onPrint,
            statusText: statusText,
            statusTagType: statusTagType,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SettlementView.vue.js.map