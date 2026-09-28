(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const yen = v => Number(v).toLocaleString('ja-JP')+'円';
  window.ComprexInquiries = { mount(root, api, openOrder) {
    let active=true, all=[], current=null, busy=false;
    const catalog=window.ComprexCatalog;
    root.innerHTML='<div class="page-heading"><h2>見積もり相談</h2><button data-new class="secondary">電話で相談を登録</button><button data-refresh class="secondary">相談を更新</button></div><p data-notice role="status"></p><div data-list></div><div data-editor></div>';
    const $=s=>root.querySelector(s), notice=s=>{if(active)$('[data-notice]').textContent=s;};
    const opts=(items,value,key='name')=>items.map(x=>`<option value="${esc(x.id)}" ${x.id===value?'selected':''}>${esc(x[key])}</option>`).join('');
    async function run(fn) {if(busy)return;busy=true;try{await fn();}catch(e){notice(e.message);}finally{busy=false;}}
    function list() {
      $('[data-list]').innerHTML=`<div class="table-wrap"><table class="inquiry-table"><thead><tr><th>店舗・担当者</th><th>状態 / 次にすること</th><th>初期費用</th><th>月額費用</th><th>受付</th></tr></thead><tbody>${all.map(q=>`<tr><td><button class="name-link" data-id="${esc(q.id)}">${esc(q.contact.shopName)}</button><small>${esc(q.contact.personName)}</small></td><td>${q.orderId?'制作へ引継ぎ済み':esc(q.status)}<small>${q.orderId?'制作案件を確認':q.acceptedAt?'Stripeの入金確認を待つ':q.quote?'専用URLをお客様へ送る':'内容を確認して正式見積もりを作る'}</small></td><td>${yen(q.quote?.total??q.estimate.initialTotal)}${q.quote?'':'〜（目安）'}</td><td>${yen(q.quote?.management.monthly??q.estimate.monthlyTotal)} / 月</td><td>${q.source==='phone'?'電話':'Web'}<small>${new Date(q.createdAt).toLocaleString('ja-JP')}</small></td></tr>`).join('')||'<tr><td colspan="5">相談はまだありません。</td></tr>'}</tbody></table></div>`;
      $('[data-list]').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>edit(all.find(q=>q.id===b.dataset.id)));
    }
    async function load() {
      let page=await api('/inquiries'), rows=[...page.inquiries];
      while(page.nextCursor){page=await api('/inquiries?before='+encodeURIComponent(page.nextCursor));rows.push(...page.inquiries);}
      if(!active)return;
      all=rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));list();
    }
    function edit(q) {
      current=q;
      const quote=q.quote, readOnly=!!q.acceptedAt;
      const lines=quote?.lines || q.estimate.selectedOptions.filter(o=>o.initial>0).map(o=>({name:o.name,amount:o.initial}));
      $('[data-editor]').innerHTML=`<section><div class="page-heading"><h2>${esc(q.contact.shopName)}</h2><button data-close class="secondary">閉じる</button></div><p>${esc(q.contact.personName)} ／ ${esc(q.contact.email)} ／ ${esc(q.contact.phone)}</p><p>${esc(q.estimate.industry.label)}</p><ul>${q.estimate.selectedOptions.map(o=>`<li>${esc(o.name)}：${esc(o.label)}</li>`).join('')}</ul><p class="inquiry-copy">${esc(q.otherRequest)}</p><p><a href="${esc(q.customerUrl)}" target="_blank" rel="noopener noreferrer">お客様の見積もり確認ページ</a> <button data-copy class="secondary">専用URLをコピー</button></p>${q.orderId?'<button data-order>制作案件を開く</button>':''}
        ${!q.orderId?`<form data-quote><fieldset ${readOnly?'disabled':''}><legend>正式見積もり</legend><div class="edit-grid"><label>制作プラン<select name="plan"><option value="omakase" ${(quote?.plan|| (q.estimate.maintenance.id==='none'?'outright':'omakase'))==='omakase'?'selected':''}>おまかせ制作 39,800円</option><option value="outright" ${quote?.plan==='outright'||(!quote&&q.estimate.maintenance.id==='none')?'selected':''}>買い切り制作 79,800円</option></select></label><label>公開後の管理<select name="maintenanceId">${opts(catalog.maintenancePlans.filter(x=>x.id!=='none'),quote?.management.id||q.estimate.maintenance.id)}</select></label></div><label>制作内容・対応範囲<textarea name="scope" required maxlength="5000">${esc(quote?.scope||'')}</textarea></label><h3>追加制作の明細</h3><div data-lines></div><button type="button" data-add class="secondary">明細を追加</button><p data-total></p><p class="note">金額は内容確認後に確定してください。目安の自動計算額を、そのまま確定料金にしないでください。買い切り制作の月額は0円です。</p></fieldset>${readOnly?'<p>お客様が合意済みのため、見積もり内容は変更できません。</p>':'<button type="submit">正式見積もりを保存・提示する</button>'}</form>`:''}
        <form data-memo><label>管理メモ<textarea name="memo" maxlength="20000">${esc(q.memo)}</textarea></label><button class="secondary">メモを保存</button></form></section>`;
      $('[data-close]').onclick=()=>{current=null;$('[data-editor]').replaceChildren();};
      $('[data-copy]').onclick=()=>navigator.clipboard.writeText(q.customerUrl).then(()=>notice('専用URLをコピーしました。お客様へお送りください。')).catch(()=>notice('コピーできませんでした。リンク先のURLをコピーしてください。'));
      if(q.orderId)$('[data-order]').onclick=()=>openOrder(q.orderId);
      function addLine(line={name:'',amount:0}) {
        const row=document.createElement('div');row.className='inquiry-line';
        row.innerHTML=`<label>内容<input data-name required maxlength="200" value="${esc(line.name)}"></label><label>金額（円）<input data-amount type="number" min="0" step="1" required value="${line.amount}"></label><button type="button" class="secondary" title="この明細を削除" aria-label="この明細を削除">×</button>`;
        row.querySelector('button').onclick=()=>{row.remove();total();};$('[data-lines]').append(row);row.oninput=total;
      }
      function total(){const f=$('[data-quote]');if(!f)return;const base=f.elements.plan.value==='omakase'?39800:79800;f.elements.maintenanceId.disabled=f.elements.plan.value==='outright'||readOnly;const sum=[...root.querySelectorAll('[data-amount]')].reduce((s,e)=>s+Number(e.value),base);$('[data-total]').textContent='初期費用 合計：'+yen(sum);}
      const form=$('[data-quote]');
      if(form){lines.forEach(addLine);$('[data-add]').onclick=()=>{addLine();total();};form.onchange=total;total();form.onsubmit=e=>{e.preventDefault();if(!confirm('この内容・料金を正式見積もりとして、お客様の専用ページに提示しますか？'))return;run(async()=>{const values=Object.fromEntries(new FormData(form));const updated=await api('/inquiries/'+q.id,{...values,revision:current.revision,action:'quote',lines:[...root.querySelectorAll('.inquiry-line')].map(r=>({name:r.querySelector('[data-name]').value,amount:Number(r.querySelector('[data-amount]').value)}))});if(!active)return;await load();edit(updated);notice('見積もりを保存しました。専用URLをコピーしてお客様へ送ってください。自動メールは送信しません。');});};}
      $('[data-memo]').onsubmit=e=>{e.preventDefault();const memo=new FormData(e.target).get('memo');run(async()=>{const updated=await api('/inquiries/'+q.id,{revision:current.revision,memo});if(!active)return;await load();edit(updated);notice('メモを保存しました。');});};
      $('[data-editor]').scrollIntoView({block:'start'});
    }
    $('[data-new]').onclick=()=>{
      current=null;
      $('[data-editor]').innerHTML=`<section><h2>電話で受けた相談を登録</h2><form data-create><div class="edit-grid">${[['shopName','店舗名'],['personName','担当者'],['email','メール'],['phone','電話']].map(([k,label])=>`<label>${label}<input name="${k}" type="${k==='email'?'email':'text'}" ${k==='phone'?'':'required'} maxlength="200"></label>`).join('')}<label>業種<select name="industryId">${opts(catalog.industries,'','label')}</select></label><label>公開後の管理<select name="maintenanceId">${opts(catalog.maintenancePlans,'light')}</select></label></div><label>相談内容<textarea name="otherRequest" maxlength="5000"></textarea></label><button>相談を登録</button></form></section>`;
      const requestId=crypto.randomUUID();$('[data-create]').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));run(async()=>{const q=await api('/inquiries',{requestId,industryId:d.industryId,maintenanceId:d.maintenanceId,optionIds:[],otherRequest:d.otherRequest,contact:{shopName:d.shopName,personName:d.personName,email:d.email,phone:d.phone}});if(!active)return;await load();edit(q);notice('相談を登録しました。正式見積もりを作成してください。');});};$('[data-editor]').scrollIntoView({block:'start'});
    };
    $('[data-refresh]').onclick=()=>run(async()=>{await load();notice('相談一覧を更新しました。');});
    run(load);
    return ()=>{active=false;root.replaceChildren();};
  }};
})();
