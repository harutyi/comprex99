(() => {
  const root = document.querySelector('#quoteApp'), message = document.querySelector('#message');
  const token = location.hash.slice(1);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const yen = v => Number(v).toLocaleString('ja-JP') + '円';
  async function api(path, data) {
    const r = await fetch('https://api.comprex99.com/api/inquiries/' + path, { method:data ? 'POST':'GET', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}, ...(data?{body:JSON.stringify(data)}:{}), cache:'no-store',signal:AbortSignal.timeout(30000) });
    const body = await r.json(); if (!r.ok) throw Error(body.error || '読み込めませんでした。'); return body;
  }
  async function load() {
    const q = await api('me'), quote = q.quote;
    root.innerHTML = `<h1>${quote?'正式なお見積もり':'ご相談を受け付けました'}</h1><p>${esc(q.contact.shopName)} ／ ${esc(q.contact.personName)} 様</p>
      <p class="note">この専用ページをブックマークしてください。第三者には共有しないでください。</p>`;
    if (q.orderUrl) {
      root.innerHTML += `<section><h2>${q.paid?'お支払いを確認しました':'お支払い状態の確認が必要です'}</h2><p>${esc(q.orderStatus)}</p><a class="action" href="${esc(q.orderUrl)}">制作案件の専用ページへ</a></section>`; return;
    }
    if (!quote) root.innerHTML += '<p>内容を確認し、正式な料金をご案内します。まだお申し込み・決済は行われていません。</p><button id="reload" class="secondary">見積もりを確認する</button>';
    else root.innerHTML += `<section><h2>制作内容</h2><p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(quote.scope)}</p><dl><dt>制作プラン</dt><dd>${quote.plan==='omakase'?'おまかせ制作':'買い切り制作'}</dd><dt>基本制作料金</dt><dd>${yen(quote.base)}</dd>${quote.lines.map(l=>`<dt>${esc(l.name)}</dt><dd>${yen(l.amount)}</dd>`).join('')}<dt>初期費用 合計</dt><dd><strong>${yen(quote.total)}</strong></dd><dt>公開後の月額費用</dt><dd>${yen(quote.management.monthly)} / 月</dd></dl><p>${esc(quote.management.name)}：${esc(quote.management.description)}</p>
      ${quote.plan==='omakase'?'<p><strong>お申し込み時点で12ヶ月の管理契約が前提です。</strong>月額費用は今回の制作費とは別です。完成サイトの確認後、公開前に管理プランのカード登録を行います。</p>':'<p>公開後の管理契約はありません。</p>'}
      <p>制作費は先払いです。お支払い後に制作情報と素材をご提出いただき、必要な情報が揃ってから原則2週間以内に初稿を制作します。</p>
      <p>決済時のメールアドレス：<strong>${esc(q.contact.email)}</strong>。変更が必要な場合は、お支払い前にご連絡ください。</p>
      <form id="accept"><label><input type="checkbox" required> 制作内容・料金${quote.plan==='omakase'?'・12ヶ月の管理契約':''}を確認し、同意します</label><p><a href="/legal/terms.html" target="_blank" rel="noopener">利用規約</a> / <a href="/legal/privacy.html" target="_blank" rel="noopener">プライバシーポリシー</a></p><button>同意してStripeで制作費を支払う</button></form></section>`;
    root.innerHTML += `<details><summary>最初にご相談いただいた内容</summary><p>${esc(q.estimate.industry.label)}</p><ul>${q.estimate.selectedOptions.map(o=>`<li>${esc(o.name)}：${esc(o.label)}</li>`).join('')}</ul><p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(q.otherRequest)}</p></details>`;
    const form = document.querySelector('#accept');
    if (form) form.onsubmit = async e => { e.preventDefault(); const button = form.querySelector('button'); button.disabled=true; message.textContent='決済ページを準備しています…'; try { location.href=(await api('accept',{version:quote.version,agree:true})).url; } catch(e) { message.textContent=e.message; button.disabled=false; } };
    const reload = document.querySelector('#reload'); if(reload) reload.onclick=()=>load().catch(e=>message.textContent=e.message);
  }
  load().catch(e=>{root.textContent='専用リンクをご確認ください。';message.textContent=e.message;});
})();
