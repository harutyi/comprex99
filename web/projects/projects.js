(() => {
  const $=s=>document.querySelector(s), plans=window.ComprexPlans, M=window.ComprexProjectModel;
  const apiBase='https://api.comprex99.com';
  let key='', orders=[], epoch=0, busy=false, selected='', emailEnabled=false;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const date=v=>v?(String(v).length===10?String(v).replaceAll('-','/'):new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})):'未設定';
  const money=v=>Number.isFinite(v)?`${v.toLocaleString('ja-JP')}円`:'未取得';
  const plan=o=>plans[o.plan]?.name||o.plan;
  const step=s=>M.steps[s]||s;
  const subLabel=s=>({active:'契約中',past_due:'支払い遅延',unpaid:'未払い',canceled:'解約済み',incomplete:'手続き未完了',incomplete_expired:'手続き期限切れ',trialing:'試用期間',paused:'停止中'})[s]||s||'未契約';
  const badge=o=>`<span class="badge ${M.group(o)==='制作中'?'progress':M.group(o)==='納品済み'?'done':M.group(o)==='情報待ち'?'alert':''}">${esc(M.group(o))}</span>`;
  function logout(){epoch++;key='';orders=[];selected='';$('#workspace').hidden=true;$('#detail').innerHTML='';$('#rows').innerHTML='';$('#summary').innerHTML='';$('#unmatched').innerHTML='';$('#login').hidden=false;$('#logout').hidden=true;$('#key').value='';$('#search').value='';$('#statusFilter').value='';$('#dueFilter').value='';history.replaceState(null,'',location.pathname);}
  function error(e){$('#message').textContent=e.message;}
  async function api(path='', data) {
    if(!key)throw Error('管理キーを入力してください。');
    const active=epoch;
    const r=await fetch(`${apiBase}/api/orders/admin${path}`,{method:data===undefined?'GET':'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:AbortSignal.timeout(30000),cache:'no-store'});
    const result=await r.json();
    if(active!==epoch)throw Error('ログアウトしました。');
    if(r.status===401){logout();throw Error(result.error||'管理キーを確認してください。');}
    if(!r.ok)throw Error(result.error||'取得できませんでした。');return result;
  }
  function renderRows(){
    const filtered=M.filter(orders,{query:$('#search').value,status:$('#statusFilter').value,due:$('#dueFilter').value});
    $('#count').textContent=`${filtered.length} / ${orders.length}件`;
    $('#rows').innerHTML=filtered.length?filtered.map(o=>`<tr class="${!M.finished(o)&&o.deliveryDueDate&&o.deliveryDueDate<M.day(Date.now())?'overdue':''}"><td><button class="name-link" data-open="${esc(o.id)}">${esc(o.contact.shopName||'店舗名未提出')}</button></td><td>${esc(o.contact.personName||'未入力')}<small>${esc(o.contact.email)}</small></td><td>${esc(plan(o))}</td><td class="money">${money(M.amount(o))}</td><td>${o.maintenance?`${money(o.maintenance.amount)}/月<small>${esc(subLabel(o.maintenance.status))}</small>`:o.plan==='outright'?'なし':'未契約'}</td><td>${esc(M.payment(o))}</td><td>${badge(o)}</td><td>${o.submittedAt?'提出済み':'入力待ち'}</td><td>${o.files.length?`${o.files.length}点`:'未提出'}</td><td>${date(o.createdAt)}</td><td>${date(o.deliveryDueDate)}</td></tr>`).join(''):'<tr><td colspan="11" class="empty">該当する案件はありません。</td></tr>';
  }
  async function load(){
    const result=await api(), all=[...result.orders];let cursor=result.nextCursor;
    while(cursor){const page=await api(`?before=${encodeURIComponent(cursor)}`);all.push(...page.orders);cursor=page.nextCursor;}
    orders=all.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));emailEnabled=result.emailEnabled;
    const s=M.summary(orders);
    $('#summary').innerHTML=[['進行中案件',`${s.ongoing}件`,''],['今月の制作入金',money(s.revenue),'現在の返金額を控除'],['月額サイト管理契約額',`${money(s.monthly)}/月`,s.unknownMonthly?`金額未取得 ${s.unknownMonthly}件を除く`:'有効な契約の基本料金'],['制作費の未確認',`${s.unpaid}件`,'登録済み案件']].map(([label,value,note])=>`<div><dt>${label}</dt><dd>${value}<small>${note}</small></dd></div>`).join('');
    renderRows();$('#updated').textContent=`更新 ${new Date().toLocaleTimeString('ja-JP')}`;
    $('#unmatched').innerHTML=result.unmatched?.length?`<section><h2>決済照合待ち ${result.unmatched.length}件</h2><ul>${result.unmatched.map(x=>`<li>${esc(x.sessionId)} / ${esc(x.email)} / ${esc(x.reason)}</li>`).join('')}</ul></section>`:'';
  }
  const pairs=items=>`<dl>${items.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v||'未設定')}</dd>`).join('')}</dl>`;
  const fields={shopName:'会社・店舗名',personName:'担当者',email:'メール',phone:'電話',address:'住所',industry:'業種',hours:'営業時間',holidays:'定休日',services:'事業内容',copy:'掲載文章',color:'希望カラー',mood:'希望する雰囲気',referenceUrl:'参考サイト',currentUrl:'現在のサイト',socialUrl:'SNS',requests:'その他要望'};
  async function detail(id){
    const result=await api(`/${encodeURIComponent(id)}`), o=result.order;emailEnabled=result.emailEnabled;selected=id;
    history.replaceState(null,'',`${location.pathname}#${encodeURIComponent(id)}`);
    const allowed=(o.allowedStatuses||[o.status]).filter(s=>!(o.plan==='outright'&&['保守契約待ち','保守中'].includes(s)));
    $('#listView').hidden=true;$('#detail').hidden=false;
    $('#detail').innerHTML=`<div class="detail-heading"><button id="back" class="secondary">一覧に戻る</button><h1>${esc(o.contact.shopName||o.contact.personName||'制作案件')}</h1>${badge(o)}</div><div class="detail-grid"><section><h2>基本情報</h2>${pairs([['会社・店舗名',o.contact.shopName],['顧客名',o.contact.personName],['電話番号',o.contact.phone],['メール',o.contact.email],['受付日時',date(o.createdAt)],['購入プラン',plan(o)],['案件番号',o.id]])}</section><section><h2>決済情報</h2>${pairs([['制作料金',money(M.amount(o))],['決済状況',M.payment(o)],['決済日時',date(o.paidAt)],['返金額',money(o.refundedAmount||0)],['Checkout Session ID',o.stripe.sessionId],['月額管理プラン',o.maintenance?(plans[o.maintenance.plan]?.name||o.maintenance.plan):'なし'],['月額料金',o.maintenance?money(o.maintenance.amount)+'/月':'なし'],['契約状態',o.maintenance?subLabel(o.maintenance.status)+(o.maintenance.cancelAtPeriodEnd?'（期間末に解約予定）':''):'未契約'],['直近請求の残額',o.maintenance?.latestInvoice?.currency==='jpy'?money(o.maintenance.latestInvoice.remaining):'未取得'],['Stripe確認日時',date(o.maintenance?.checkedAt||o.stripe.checkedAt)]])}<button type="button" id="sync" class="secondary">Stripe決済・契約状況を確認</button></section><section class="full"><h2>制作管理</h2><form id="edit"><div class="edit-grid"><label>案件ステータス<select name="status">${allowed.map(s=>`<option value="${esc(s)}" ${s===o.status?'selected':''}>${esc(step(s))}</option>`).join('')}</select></label><label>納品予定日<input name="deliveryDueDate" type="date" value="${esc(o.deliveryDueDate)}"></label><label>確認用URL<input name="previewUrl" type="url" value="${esc(o.previewUrl)}"></label><label>公開URL・引き渡し先URL<input name="publicUrl" type="url" value="${esc(o.publicUrl)}"></label><label>管理メモ<textarea name="memo">${esc(o.memo)}</textarea></label><label>修正内容<textarea name="revisions">${esc(o.revisions)}</textarea></label></div><p class="hint">初稿予定日：${date(o.dueAt)}　／　制作情報：${o.submittedAt?'提出済み':'入力待ち'}　／　顧客OK：${o.approvedAt?'確認済み':'未確認'}</p><button type="submit">変更を保存</button></form></section><section><h2>制作情報</h2>${Object.keys(o.information).length?pairs(Object.entries(o.information).map(([k,v])=>[fields[k]||k,v])):'<p>制作情報はまだ提出されていません。</p>'}</section><section><h2>提出素材 ${o.files.length}点</h2><ul class="files">${o.files.map(f=>`<li><button class="secondary" data-file="${esc(f.id)}">${esc(f.name)} を取得</button><p class="note">${Math.ceil(f.size/1024)} KB / ${date(f.at)}</p></li>`).join('')||'<li>素材はまだ提出されていません。</li>'}</ul><h2>顧客専用ページ</h2><a href="${esc(o.customerUrl)}" target="_blank" rel="noopener noreferrer">制作情報・管理プランの手続き</a>${o.salesReference?`<h2>営業先の紐付け</h2>${pairs([['連携元',o.salesReference.source],['営業先ID',o.salesReference.leadId]])}`:''}</section><section class="full"><h2>変更履歴</h2><ul class="history">${o.history.map(h=>`<li>${date(h.at)} ${h.type==='deliveryDueDate'?'納品予定日 ':''}${esc(step(h.from))} → ${esc(step(h.to))}</li>`).join('')||'<li>変更履歴はありません。</li>'}</ul></section><details class="full"><summary>任意のメール通知・決済照合</summary><p>${emailEnabled?'メール送信設定済み':'メール未設定。案件の保存・制作管理には影響しません。'}</p><button id="mail" ${emailEnabled?'':'disabled'}>確認メールを送る</button><button id="reconcile" class="secondary">管理決済を紐付ける</button><ul>${o.mail.map(m=>`<li>${esc(m.subject)} ／ ${esc(({paused:'送信保留（メール未設定）',pending:'送信待ち',sending:'送信結果要確認',sent:'送信済み',failed:'送信失敗・要確認'})[m.state]||m.state)} ${['paused','failed','sending'].includes(m.state)?`<button data-retry="${esc(m.id)}" ${emailEnabled?'':'disabled'}>再送</button>`:''}</li>`).join('')}</ul></details></div>`;
    $('#back').onclick=()=>{selected='';history.replaceState(null,'',location.pathname);$('#detail').hidden=true;$('#detail').innerHTML='';$('#listView').hidden=false;load().catch(error);};
    async function action(suffix,data){if(busy)return;busy=true;$('#message').textContent='保存しています…';try{const r=await api(`/${encodeURIComponent(id)}${suffix}`,data);await load();await detail(id);$('#message').textContent=suffix?r.message:'変更を保存しました。';}catch(e){error(e);}finally{busy=false;}}
    $('#edit').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));if(values.status==='キャンセル'&&!confirm('この案件をキャンセルにしますか？ Stripeの返金・契約解約は別のお手続きです。'))return;action('',values);};
    $('#sync').onclick=()=>action('/sync',{});
    $('#mail').onclick=()=>{if(confirm('保存済みの確認URLをメールで送りますか？'))action('/mail',{});};
    $('#reconcile').onclick=()=>{const sessionId=prompt('照合待ちの管理決済のCheckout Session ID');if(sessionId)action('/reconcile',{sessionId});};
    $('#detail').querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>{if(confirm('送信済みでないことを確認しましたか？'))action('/retry',{mailId:b.dataset.retry});});
    $('#detail').querySelectorAll('[data-file]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const active=epoch;const r=await fetch(`${apiBase}/api/orders/admin/${encodeURIComponent(id)}/file?id=${encodeURIComponent(b.dataset.file)}`,{headers:{Authorization:`Bearer ${key}`},cache:'no-store'});if(active!==epoch)return;if(!r.ok)throw Error('素材を取得できません。');const blob=await r.blob();if(active!==epoch)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=o.files.find(f=>f.id===b.dataset.file).name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}catch(e){error(e);}finally{b.disabled=false;}});
    window.scrollTo(0,0);
  }
  $('#rows').onclick=e=>{const b=e.target.closest('[data-open]');if(b)detail(b.dataset.open).catch(error);};
  for(const id of ['search','statusFilter','dueFilter'])$('#'+id).addEventListener(id==='search'?'input':'change',renderRows);
  $('#refresh').onclick=async()=>{if(busy)return;busy=true;try{await load();$('#message').textContent='一覧を更新しました。';}catch(e){error(e);}finally{busy=false;}};
  $('#logout').onclick=logout;
  $('#login').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;key=$('#key').value;epoch++;const link=location.hash.slice(1);try{await load();$('#key').value='';$('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;$('#listView').hidden=false;$('#detail').hidden=true;$('#message').textContent='';if(link)await detail(decodeURIComponent(link));}catch(e){error(e);}finally{busy=false;}};
  setInterval(()=>{if(key&&!busy&&!selected&&!document.hidden){busy=true;load().catch(error).finally(()=>busy=false);}},60000);
})();
