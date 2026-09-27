(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const date = v => new Date(v).toLocaleString('ja-JP', {timeZone:'Asia/Tokyo'});
  window.ComprexSupport = { mount(root, request, admin = false) {
    let tickets = [], cursor = null, busy = false, stopped = false, selectedId = '';
    root.innerHTML = `<h2>${admin?'問い合わせ管理':'お問い合わせ履歴'}</h2><p class="support-note">回答はこの画面に保存されます。メール通知はありません。${admin?'銀行振込の相談は受付のみです。リコーリースの契約・入金確認とは連動していません。':'銀行振込をご希望の場合も、まずはご相談ください。受付だけでは支払方法は変更されません。'}</p>
      <div class="support-toolbar">${admin?'<label>対応状況<select data-filter><option value="">すべて</option><option selected>受付</option><option>対応中</option><option>回答済み</option><option>完了</option></select></label>':''}<button type="button" data-refresh>最新の状況を確認</button><span data-count></span></div>
      <p class="support-feedback" role="status"></p><ul class="support-list"></ul><button type="button" data-more hidden>続きを読み込む</button><div class="support-thread" hidden></div>
      ${admin?'':`<details class="support-new"><summary>新しいお問い合わせ</summary><form data-new><label>種類<select name="kind"><option>相談</option><option>修正依頼</option><option>質問</option><option>銀行振込の相談</option></select></label><label>件名<input name="title" maxlength="120" required></label><label>内容<textarea name="body" maxlength="5000" required></textarea></label><button>送信する</button></form></details>`}`;
    const $ = s => root.querySelector(s), feedback = text => {if(!stopped) $('.support-feedback').textContent = text;};
    async function load(more = false) {
      const query = new URLSearchParams({status: $('[data-filter]')?.value || ''});
      if(more && cursor) query.set('before', cursor);
      const result = await request(`?${query}`);
      if(stopped)return;
      tickets = more ? [...new Map([...tickets, ...result.tickets].map(t=>[t.id,t])).values()] : result.tickets;
      cursor = result.nextCursor;
      $('[data-count]').textContent = `${tickets.length}件${cursor?'以上':''}`;
      $('.support-list').innerHTML = tickets.length ? tickets.map(t=>`<li><button type="button" class="secondary" data-ticket="${esc(t.id)}">${esc(t.status)} · ${esc(t.title)}</button><p class="support-note">${admin?esc(t.shopName)+' · ':''}${esc(t.kind)} · ${date(t.updatedAt)}</p></li>`).join('') : '<li>該当するお問い合わせはありません。</li>';
      $('[data-more]').hidden = !cursor;
      if (selectedId) {
        const selected = tickets.find(t => t.id === selectedId);
        if (selected) show(selected, true);
        else { selectedId = ''; $('.support-thread').hidden = true; $('.support-thread').innerHTML = ''; }
      }
    }
    async function run(action) {if(busy)return;busy=true;try{await action();}catch(e){feedback(e.message);}finally{busy=false;}}
    function show(t, preserveDraft = false) {
      const previous = preserveDraft ? $('.support-thread form') : null;
      const draft = previous ? Object.fromEntries(new FormData(previous)) : null;
      const previousId = previous?.dataset.requestId;
      selectedId = t.id;
      const panel=$('.support-thread');panel.hidden=false;
      panel.innerHTML=`<h3>${esc(t.title)}</h3><p>${esc(t.kind)} ／ ${esc(t.status)}</p>${admin?`<p>${esc(t.shopName)} ／ 電話：${esc(t.phone||'未登録')} <a href="/web/projects/#${encodeURIComponent(t.orderId)}">案件情報</a></p>`:''}<ol class="support-messages">${t.messages.map(m=>`<li class="${m.author==='staff'?'staff':''}"><strong>${m.author==='staff'?'Comprex99':'お客様'}</strong> <small>${date(m.at)}</small><p>${esc(m.body||'対応状況を変更しました。')}</p>${m.status?`<small>${esc(m.status)}</small>`:''}</li>`).join('')}</ol><form data-reply><label>返信<textarea name="body" maxlength="5000" ${admin?'':'required'}></textarea></label>${admin?`<label>対応状況<select name="status">${['受付','対応中','回答済み','完了'].map(s=>`<option ${s==='回答済み'?'selected':''}>${s}</option>`).join('')}</select></label>`:''}<button>${admin?'回答・対応状況を保存':'返信を送信'}</button></form>`;
      const form = panel.querySelector('form');
      form.dataset.requestId = previousId || crypto.randomUUID();
      if (draft) for (const [name,value] of Object.entries(draft)) form.elements[name].value = value;
      form.oninput=()=>{form.dataset.requestId=crypto.randomUUID();};
      form.onsubmit=e=>{e.preventDefault();run(async()=>{const updated=await request('/'+encodeURIComponent(t.id),{...Object.fromEntries(new FormData(form)),requestId:form.dataset.requestId});if(stopped)return;await load();show({...t,...updated});feedback('保存しました。');});};
    }
    $('.support-list').onclick=e=>{const b=e.target.closest('[data-ticket]');if(b)show(tickets.find(t=>t.id===b.dataset.ticket));};
    $('[data-refresh]').onclick=()=>run(async()=>{await load();feedback('最新の状況を読み込みました。');});
    $('[data-more]').onclick=()=>run(()=>load(true));
    if($('[data-filter]')) $('[data-filter]').onchange=()=>run(()=>load());
    if($('[data-new]')) {
      const form=$('[data-new]');let requestId=crypto.randomUUID();form.oninput=()=>{requestId=crypto.randomUUID();};
      form.onsubmit=e=>{e.preventDefault();run(async()=>{const t=await request('',{...Object.fromEntries(new FormData(form)),requestId});if(stopped)return;form.reset();requestId=crypto.randomUUID();await load();show(t);feedback('お問い合わせを受け付けました。回答はこのページでご確認ください。');});};
    }
    run(()=>load());
    return ()=>{stopped=true;root.innerHTML='';};
  }};
  const root=document.querySelector('#customerSupport');
  if(root) {
    const token=location.hash.slice(1);
    if(!/^[A-Za-z0-9_-]{32}$/.test(token)){root.textContent='ご契約時の専用ページから「ご相談・修正依頼」を開いてください。';return;}
    document.querySelector('#orderLink').href='/web/order/#'+token;
    window.ComprexSupport.mount(root, async(path,data)=>{
      const response=await fetch('https://api.comprex99.com/api/orders/support'+path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),cache:'no-store',signal:AbortSignal.timeout(30000)});
      const result=await response.json();if(!response.ok)throw Error(result.error||'接続できませんでした。');return result;
    });
  }
})();
