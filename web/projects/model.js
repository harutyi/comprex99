(function(root) {
  const labels = { '制作情報入力待ち':'情報待ち', '制作準備完了':'制作待ち', '制作中':'制作中', '初稿完成':'顧客確認待ち', '顧客確認中':'顧客確認待ち', '修正中':'修正中', '顧客OK':'納品待ち', '保守契約待ち':'納品待ち', '公開準備':'納品待ち', '納品完了':'納品済み', '保守中':'納品済み', 'キャンセル':'キャンセル', '決済待ち':'決済待ち' };
  const steps = { '制作情報入力待ち':'情報待ち', '制作準備完了':'制作待ち', '制作中':'制作中', '初稿完成':'初稿完成', '顧客確認中':'顧客確認待ち', '修正中':'修正中', '顧客OK':'顧客OK', '保守契約待ち':'管理契約待ち', '公開準備':'納品待ち（公開準備）', '納品完了':'納品済み', '保守中':'納品済み・サイト管理中' };
  const day = value => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
  const group = o => labels[o.status] || o.status;
  const finished = o => ['納品済み','キャンセル'].includes(group(o));
  const amount = o => Number.isFinite(o.stripe?.amount) ? o.stripe.amount : null;
  const refunded = o => amount(o)>0 && (o.refundedAmount||0)>=amount(o);
  const payment = o => refunded(o)?'返金済み':o.paid?(o.refundedAmount?'一部返金・支払済み':'支払済み'):'未確認';
  function filter(orders, {query='',status='',due=''}={}, today=day(Date.now())) {
    const end=day(new Date(`${today}T12:00:00+09:00`).getTime()+6*86400000);
    return orders.filter(o=>(!query || [o.contact.shopName,o.contact.personName,o.contact.email,o.id].join(' ').toLowerCase().includes(query.toLowerCase())) && (!status || group(o)===status) && (!due || (!finished(o) && (due==='overdue'?o.deliveryDueDate && o.deliveryDueDate<today:due==='week'?o.deliveryDueDate>=today && o.deliveryDueDate<=end:!o.deliveryDueDate))));
  }
  function summary(orders, today=day(Date.now())) {
    let revenue=0, monthly=0, unknownMonthly=0, unpaid=0;
    for (const o of orders) {
      if(o.paidAt && day(o.paidAt).slice(0,7)===today.slice(0,7) && (o.paid || refunded(o))) revenue+=Math.max(0,(amount(o)||0)-(o.refundedAmount||0));
      if(o.maintenance?.status==='active') {
        if(Number.isFinite(o.maintenance.amount))monthly+=o.maintenance.amount;else unknownMonthly++;
      }
      if(!o.paid && !refunded(o) && o.status!=='キャンセル')unpaid++;
    }
    return { ongoing:orders.filter(o=>!finished(o)).length,revenue,monthly,unknownMonthly,unpaid };
  }
  const model={labels,steps,day,group,finished,amount,payment,filter,summary};
  if(typeof module==='object' && module.exports)module.exports=model;else root.ComprexProjectModel=model;
})(globalThis);
