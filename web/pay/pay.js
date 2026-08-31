(() => {
  const app = document.querySelector("#quoteApp");
  const token = location.pathname.match(/\/web\/pay\/([^/]+)/)?.[1] || "";
  const yen = (value) => `${Number(value || 0).toLocaleString("ja-JP")}円`;
  const dateText = (value) => value ? new Date(value).toLocaleDateString("ja-JP") : "";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function loadQuote() {
    const response = await fetch(`/api/estimates/${encodeURIComponent(token)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "見積書を読み込めませんでした。");
    return result.estimate;
  }

  function render(estimate) {
    const rows = [
      ["サイト制作費", estimate.totals.productionFee],
      ...(estimate.options || []).map((item) => [item.name, item.initial])
    ];
    app.innerHTML = `
      <article class="quote" id="quoteSheet">
        <header class="quote-head">
          <div>
            <p class="muted">御見積書</p>
            <h1>${escapeHtml(estimate.contact.shopName)} 御中</h1>
          </div>
          <div>
            <p>発行日: ${dateText(estimate.createdAt)}</p>
            <p>見積番号: ${escapeHtml(estimate.quoteNo)}</p>
            <p>有効期限: ${dateText(estimate.expiresAt)}</p>
          </div>
        </header>

        <section class="quote-parties">
          <div>
            <p class="muted">ご担当者</p>
            <p>${escapeHtml(estimate.contact.personName)} 様</p>
            <p>${escapeHtml(estimate.contact.email)}</p>
            <p>${escapeHtml(estimate.contact.phone)}</p>
          </div>
          <div>
            <p class="muted">発行者</p>
            <p>Comprex99 / 加藤晴士</p>
            <p>web@comprex99.com</p>
          </div>
        </section>

        <table class="quote-table">
          <thead><tr><th>項目</th><th>金額</th></tr></thead>
          <tbody>${rows.map(([name, amount]) => `<tr><td>${escapeHtml(name)}</td><td>${yen(amount)}</td></tr>`).join("")}</tbody>
        </table>

        <section class="quote-total">
          <div><span class="muted">初期費用の合計</span><strong>${yen(estimate.totals.initialTotal)}</strong></div>
          <div><span class="muted">月額費用</span><strong>${yen(estimate.totals.monthlyTotal)}</strong><p>${escapeHtml(estimate.maintenance.name)}</p></div>
        </section>

        <section class="terms">
          <h2>契約条件・特定商取引法に基づく表示</h2>
          <ul>
            <li>決済ボタンを押した時点で、初期費用が即時決済されます。</li>
            <li>保守費用はサイト公開日から毎月自動で課金されます。開始予定日: ${dateText(estimate.publishAt)}</li>
            <li>保守の最低契約期間は12ヶ月、以降自動更新です。解約は1ヶ月前までの申告が必要です。</li>
            <li>納期は入金確認後3営業日です。修正は2回まで無料です。</li>
            <li>キャンセルは着手前は全額返金、着手後は返金不可です。</li>
            <li>ドメインは当方名義で管理し、解約時はお客様名義へ移管します。取得後60日は移管できません。</li>
            <li>事業者名: Comprex99 / 所在地: 愛知県 / 代表者: 加藤晴士 / 連絡先: web@comprex99.com</li>
          </ul>
        </section>

        <section class="quote-actions">
          <label><input type="checkbox" id="agreeTerms"> 上記内容に同意します</label>
          <div class="buttons">
            <button type="button" id="printQuote">印刷・PDF保存</button>
            <button type="button" id="exportImage">画像として保存</button>
            <button class="primary" type="button" id="checkoutButton" disabled>内容を確認して決済する</button>
          </div>
        </section>
        <p class="error" id="payMessage"></p>
      </article>
    `;

    const agree = document.querySelector("#agreeTerms");
    const checkout = document.querySelector("#checkoutButton");
    const message = document.querySelector("#payMessage");
    agree.addEventListener("change", () => {
      checkout.disabled = !agree.checked;
    });
    document.querySelector("#printQuote").addEventListener("click", () => window.print());
    document.querySelector("#exportImage").addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fffefa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#17231d";
      ctx.font = "bold 56px sans-serif";
      ctx.fillText("御見積書", 80, 110);
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(`${estimate.contact.shopName} 御中`, 80, 180);
      ctx.font = "28px sans-serif";
      ctx.fillText(`見積番号: ${estimate.quoteNo}`, 80, 245);
      ctx.fillText(`発行日: ${dateText(estimate.createdAt)}`, 80, 290);
      let y = 380;
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("明細", 80, y);
      y += 54;
      ctx.font = "26px sans-serif";
      rows.forEach(([name, amount]) => {
        ctx.fillText(name, 80, y);
        ctx.fillText(yen(amount), 900, y);
        y += 48;
      });
      y += 30;
      ctx.fillStyle = "#eaf1eb";
      ctx.fillRect(70, y - 42, 1060, 150);
      ctx.fillStyle = "#0f493b";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText(`初期費用 合計 ${yen(estimate.totals.initialTotal)}`, 100, y + 10);
      ctx.fillText(`月額 ${yen(estimate.totals.monthlyTotal)} / ${estimate.maintenance.name}`, 100, y + 66);
      y += 170;
      ctx.fillStyle = "#17231d";
      ctx.font = "24px sans-serif";
      [
        "決済ボタンを押した時点で、初期費用が即時決済されます。",
        `保守費用はサイト公開日から毎月自動で課金されます。開始予定日: ${dateText(estimate.publishAt)}`,
        "最低契約期間は12ヶ月、以降自動更新。解約は1ヶ月前までの申告が必要です。",
        "納期は入金確認後3営業日。修正は2回まで無料です。",
        "事業者名: Comprex99 / 代表者: 加藤晴士 / 連絡先: web@comprex99.com"
      ].forEach((line) => {
        ctx.fillText(line.slice(0, 48), 80, y);
        y += 44;
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${estimate.quoteNo}.png`;
      a.click();
    });
    checkout.addEventListener("click", async () => {
      message.textContent = "";
      const response = await fetch(`/api/estimates/${encodeURIComponent(token)}/checkout`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        message.textContent = result.error || "決済ページを作成できませんでした。";
        return;
      }
      location.href = result.url;
    });
  }

  loadQuote().then(render).catch((error) => {
    app.innerHTML = `<main class="quote"><p class="error">${escapeHtml(error.message)}</p></main>`;
  });
})();
