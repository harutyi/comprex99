(() => {
  const app = document.querySelector("#orderApp"), message = document.querySelector("#message");
  const plans = window.ComprexPlans;
  let token = location.hash.slice(1);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  async function api(route, data) {
    const r = await fetch(`https://api.comprex99.com/api/orders/${route}`, { method: data ? "POST" : "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, ...(data ? { body: JSON.stringify(data) } : {}) });
    let result; try { result = await r.json(); } catch { throw Error("受付サーバーに接続できません。窓口へご連絡ください。"); }
    if (!r.ok) throw Error(result.error || "受付サーバーに接続できません。"); return result;
  }
  const fields = {
    shopName: "会社名・店舗名", personName: "担当者名", email: "メールアドレス", phone: "電話番号", address: "住所", industry: "業種", hours: "営業時間", holidays: "定休日", services: "事業・サービス内容", copy: "掲載したい文章", color: "希望する色", mood: "希望する雰囲気", referenceUrl: "参考サイトURL", currentUrl: "現在のホームページURL", socialUrl: "SNS URL", requests: "その他のご要望"
  };
  const required = ["shopName", "personName", "email", "phone", "address", "industry", "services"];
  function field(key, data) { return `<label>${fields[key]}${required.includes(key) ? "（必須）" : ""}${["services", "copy", "requests"].includes(key) ? `<textarea name="${key}" maxlength="10000" ${required.includes(key)?"required":""}>${esc(data[key])}</textarea>` : `<input name="${key}" value="${esc(data[key])}" maxlength="10000" type="${key === "email" ? "email" : key.endsWith("Url") ? "url" : "text"}" ${required.includes(key)?"required":""}>`}</label>`; }
  async function load() {
    const o = await api("me");
    const data = { ...o.contact, ...o.information };
    app.innerHTML = `<h1>${esc(plans[o.plan].name)}</h1><p>制作費のお支払い：${o.paid ? "確認済み" : "要確認"}　／　${esc(o.status)}</p>`;
    if (!o.paid || o.status === "キャンセル") { app.innerHTML += "<p>お手続きについて窓口へご連絡ください。</p>"; return; }
    if (o.emailEnabled === false) app.innerHTML += '<section role="status"><p>現在、メールでのご案内を一時停止しています。お支払い・入力内容の保存は通常どおり受け付けています。</p><p>続きから入力できるよう、このページをブックマークするか、URLを保存してください。専用URLは第三者に共有しないでください。</p></section>';
    if (o.submittedAt) {
      app.innerHTML += o.publishedAt
        ? `<section class="success"><h2>公開・納品が完了しました。</h2><p><a href="${esc(o.publicUrl)}" target="_blank" rel="noopener noreferrer">公開したサイトを見る</a></p></section>`
        : o.previewUrl ? `<section><h2>制作サイトをご確認ください</h2><p>修正のご希望があれば、確認メールへの返信またはお電話でお知らせください。</p></section>`
        : `<section class="success"><h2>お申し込み手続きは完了しました。</h2><p>原則2週間以内に初稿を制作します。追加で確認が必要な場合のみご連絡します。</p><p>初稿予定日：${esc(new Date(o.dueAt).toLocaleDateString("ja-JP"))}</p></section>`;
      if (o.previewUrl) app.innerHTML += `<p><a class="action" href="${esc(o.previewUrl)}" target="_blank" rel="noopener noreferrer">制作したサイトを確認する</a></p>`;
      if (o.plan === "omakase" && o.approvedAt && !o.maintenance?.subscriptionId && ["顧客OK", "保守契約待ち", "公開準備"].includes(o.status)) {
        app.innerHTML += `<section><h2>公開後の管理プラン</h2><p>12ヶ月契約です。請求開始日はStripeの決済画面でご確認ください。公開準備が整ってからお手続きください。</p><div class="plans">${["basic","support","managed"].map(k=>`<article><h3>${esc(plans[k].name)}</h3><strong>${plans[k].amount.toLocaleString()}円/月</strong><p>${k === "basic" ? "ドメイン・サーバー・SSLと契約更新の管理。内容の更新は含みません。" : k === "support" ? "基本管理にCMS更新・バックアップ・セキュリティ管理を追加。内容の更新は含みません。" : "文章・写真・商品情報など、既存サイトの軽微な更新も代行します。SNS運用代行や大規模開発は含みません。"}</p><button data-plan="${k}">このプランで手続きする</button></article>`).join("")}</div></section>`;
        app.querySelectorAll("[data-plan]").forEach(b => b.onclick = async () => { if (!confirm("12ヶ月の管理契約です。Stripeで料金・請求開始日をご確認ください。決済ページへ進みますか？")) return; b.disabled = true; try { location.href = (await api("management", { plan: b.dataset.plan })).url; } catch(e) { message.textContent=e.message; b.disabled=false; } });
      } else if (o.maintenance) app.innerHTML += `<p>管理契約：${esc(plans[o.maintenance.plan].name)} ／ ${esc(o.maintenance.status)}</p>`;
      return;
    }
    app.innerHTML += `<p>制作情報と素材をお送りください。途中保存して、同じ専用リンクから再開できます。</p><form id="information"><fieldset><legend>1. 店舗・ご担当者</legend><div class="grid">${["shopName","personName","email","phone","address","industry","hours","holidays"].map(k=>field(k,data)).join("")}</div></fieldset><fieldset><legend>2. 掲載内容とデザイン</legend>${["services","copy","color","mood","referenceUrl","currentUrl","socialUrl","requests"].map(k=>field(k,data)).join("")}</fieldset><fieldset><legend>3. ロゴ・店舗写真・商品写真・その他の素材</legend><p class="note">JPEG・PNG・WebP・PDF。1点10MB、合計50MB・20点まで。公開する権利のある素材をお送りください。</p><input id="files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf"><ul id="filesList">${o.files.map(f=>`<li>${esc(f.name)}</li>`).join("")}</ul><p id="uploadState" role="status"></p></fieldset><label><input id="complete" type="checkbox" required> 制作に必要な情報・素材を揃えました</label><div class="actions"><button type="button" class="secondary" id="save">途中保存する</button><button type="submit">制作情報を提出する</button></div></form>`;
    const form = document.querySelector("#information");
    let uploading = false;
    async function save(submit) { message.textContent = "保存しています…"; try { const result = await api("information", { ...Object.fromEntries(new FormData(form)), submit }); message.textContent = submit ? "提出しました。" : "途中保存しました。"; if (result.submittedAt) await load(); } catch (e) { message.textContent = e.message; } }
    document.querySelector("#save").onclick = () => save(false);
    form.onsubmit = async e => { e.preventDefault(); if (uploading) return; const b = form.querySelector('[type="submit"]'); b.disabled = true; await save(true); b.disabled = false; };
    document.querySelector("#files").onchange = async e => {
      uploading = true; const state = document.querySelector("#uploadState"); form.querySelector('[type="submit"]').disabled = true;
      try {
        for (const f of e.target.files) {
          if (f.size > 10*1024*1024) throw Error("1点10MBまでです。"); state.textContent = `${f.name} を送信中…`;
          const data = await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result).split(",")[1]); reader.onerror=reject; reader.readAsDataURL(f); });
          await api("upload", { name:f.name, data }); const li=document.createElement("li"); li.textContent=f.name; document.querySelector("#filesList").append(li);
        }
        state.textContent="素材を受け付けました。";
      } catch(e) { state.textContent=e.message; } finally { uploading=false; form.querySelector('[type="submit"]').disabled=false; e.target.value=""; }
    };
  }
  async function start() {
    const query = new URLSearchParams(location.search);
    if (query.get("session_id")) {
      const sessionId = query.get("session_id");
      // Only the verified server response grants access, never the query string itself.
      const result = await api("session", { sessionId });
      if (result.managementConfirmed) {
        history.replaceState(null, "", location.pathname);
        app.innerHTML = "<h1>管理プランのお手続きを確認しました。</h1><p>契約状況を確認のうえ、本番公開へ進めます。ご案内までお待ちください。</p><a href='/web/'>Comprex99へ戻る</a>";
        return;
      }
      token = result.token;
      history.replaceState(null, "", `${location.pathname}#${token}`);
    }
    if (!token) { app.innerHTML="<h1>制作のお手続き</h1><p>決済完了後に表示される専用ページ、または保存した専用URLからお進みください。お支払い済みで専用URLが分からない場合は、再決済せず窓口へご連絡ください。</p><a href='/web/#price'>料金・お申し込みへ</a>"; return; }
    await load();
  }
  start().catch(e => { app.innerHTML="<h1>お手続きを確認できませんでした</h1><p>お支払い済みの場合は再決済せず、「もう一度確認する」を押してください。解消しない場合は窓口へご連絡ください。</p><button id='retry'>もう一度確認する</button>"; message.textContent=e.message; document.querySelector("#retry").onclick=()=>location.reload(); });
})();
