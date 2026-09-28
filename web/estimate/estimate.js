(() => {
  const { industries, maintenancePlans, visibleOptions, calculateEstimate, initialProductionFee } = window.ComprexCatalog;
  const form = document.querySelector("#estimateForm");
  const industryChoices = document.querySelector("#industryChoices");
  const maintenanceChoices = document.querySelector("#maintenanceChoices");
  const optionChoices = document.querySelector("#optionChoices");
  const productionFeeNote = document.querySelector("#productionFeeNote");
  const initialTotal = document.querySelector("#initialTotal");
  const monthlyTotal = document.querySelector("#monthlyTotal");
  const formMessage = document.querySelector("#formMessage");
  // GitHub Pages and the static preview do not provide the local sales API.
  const emailConsultation = location.hostname === "comprex99.com" ||
    location.hostname === "www.comprex99.com" || location.hostname.endsWith(".github.io") ||
    location.port === "5179";
  if (emailConsultation) {
    form.querySelector('[type="submit"]').textContent = "メールで見積もりを相談する";
    formMessage.textContent = "メール作成画面を開きます。メールを送信するまで相談は届きません。内容確認・正式見積もりへの合意後に、お申し込みとお支払いをご案内します。";
  }
  const visibleMaintenancePlans = maintenancePlans.filter((item) => item.id !== "none");
  const defaultMaintenance = visibleMaintenancePlans.find((item) => item.recommended) || visibleMaintenancePlans[0];

  const yen = (value) => `${Number(value || 0).toLocaleString("ja-JP")}円`;

  function renderChoices() {
    industryChoices.innerHTML = industries.map((item, index) => `
      <label class="choice">
        <input type="radio" name="industryId" value="${item.id}" ${index === 0 ? "checked" : ""}>
        <strong>${item.label}</strong>
      </label>
    `).join("");

    maintenanceChoices.innerHTML = visibleMaintenancePlans.map((item) => `
      <label class="plan">
        <input type="radio" name="maintenanceId" value="${item.id}" ${item.id === defaultMaintenance.id ? "checked" : ""}>
        <strong>${item.name} / 月額 ${yen(item.monthly)}</strong>
        <span>${item.description}</span>
      </label>
    `).join("");
  }

  function selected(name) {
    return form.querySelector(`[name="${name}"]:checked`)?.value || "";
  }

  function selectedOptions() {
    return [...form.querySelectorAll('[name="optionIds"]:checked')].map((input) => input.value);
  }

  function renderOptions() {
    const industryId = selected("industryId");
    const checked = new Set(selectedOptions());
    optionChoices.innerHTML = visibleOptions(industryId).map((item) => `
      <label class="option-row">
        <input type="checkbox" name="optionIds" value="${item.id}" ${checked.has(item.id) ? "checked" : ""}>
        <strong>${item.name}</strong>
        <span>${item.label || (item.initial ? yen(item.initial) : "基本料金に含む")}</span>
        ${item.note ? `<small>${item.note}</small>` : ""}
      </label>
    `).join("");
  }

  function updateTotal() {
    const maintenanceId = selected("maintenanceId") || defaultMaintenance.id;
    const estimate = calculateEstimate({
      industryId: selected("industryId"),
      maintenanceId,
      optionIds: selectedOptions()
    });
    initialTotal.textContent = `${yen(estimate.initialTotal)}〜`;
    monthlyTotal.textContent = yen(estimate.monthlyTotal);
    document.querySelector("#baseFee").textContent = yen(estimate.productionFee) + "〜";
    document.querySelector("#optionsSubtotal").textContent = yen(estimate.optionsTotal) + (estimate.optionsTotal ? "〜" : "");
    document.querySelector("#initialBreakdownTotal").textContent = yen(estimate.initialTotal) + "〜";
    document.querySelector("#monthlyBreakdownTotal").textContent = yen(estimate.monthlyTotal) + " / 月";
    const breakdown = document.querySelector("#selectedBreakdown");
    breakdown.replaceChildren();
    for (const item of estimate.selectedOptions) {
      const row = document.createElement("li");
      const name = document.createElement("span");
      const price = document.createElement("span");
      name.textContent = item.name;
      price.textContent = item.label || yen(item.initial);
      row.append(name, price);
      breakdown.append(row);
    }
    if (!estimate.selectedOptions.length) {
      const row = document.createElement("li");
      row.textContent = "追加のご希望は未選択です。";
      breakdown.append(row);
    }
    document.querySelector("#estimateScope").textContent = estimate.selectedOptions.some(item => item.id === "system-work" || item.id === "booking-form")
      ? "複雑な機能は内容確認後の個別見積もりです。表示額は確定料金ではありません。"
      : "基本料金内の項目を選んでも、初期費用は増えません。";
    productionFeeNote.textContent = `おまかせ制作の基本料金は${yen(initialProductionFee(maintenanceId))}〜です。月額管理費は別途かかり、お申し込み時点で12ヶ月の管理契約が前提となります。`;
    if (selectedOptions().includes("seasonal-operation")) {
      productionFeeNote.textContent += maintenanceId === "managed"
        ? " 季節商品・キャンペーンの定期更新は、選択中の更新サポートに含まれます。"
        : " 季節商品・キャンペーンの定期更新を任せる場合は、運用代行プランをお選びください。";
    }
  }

  renderChoices();
  renderOptions();
  updateTotal();

  form.addEventListener("change", (event) => {
    if (event.target.name === "industryId") renderOptions();
    updateTotal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.className = "form-message";
    formMessage.textContent = "送信しています...";
    const data = new FormData(form);
    const payload = {
      industryId: selected("industryId"),
      maintenanceId: selected("maintenanceId") || defaultMaintenance.id,
      optionIds: selectedOptions(),
      otherRequest: String(data.get("otherRequest") || ""),
      contact: {
        shopName: String(data.get("shopName") || ""),
        personName: String(data.get("personName") || ""),
        phone: String(data.get("phone") || ""),
        email: String(data.get("email") || "")
      },
      companyUrl: String(data.get("company_url") || "")
    };

    if (emailConsultation) {
      const estimate = calculateEstimate(payload);
      const message = [
        "ホームページ制作の見積もり相談",
        "業種：" + estimate.industry.label,
        "店名：" + payload.contact.shopName,
        "お名前：" + payload.contact.personName,
        "電話番号：" + payload.contact.phone,
        "メール：" + payload.contact.email,
        "基本制作料金：" + yen(estimate.productionFee) + "〜",
        ...estimate.selectedOptions.map(item => item.name + "：" + item.label),
        "追加制作費 小計：" + yen(estimate.optionsTotal) + "（目安）",
        "初期費用 合計：" + yen(estimate.initialTotal) + "〜",
        "月額費用：" + yen(estimate.monthlyTotal) + " / " + estimate.maintenance.name,
        "季節更新の代行：" + (payload.optionIds.includes("seasonal-operation") && payload.maintenanceId !== "managed" ? "運用代行プラン（月額25,000円）への変更が必要。上記月額には未反映。" : "選択内容を確認"),
        "おまかせ制作は12ヶ月の管理契約が前提。正式な料金は内容確認後。",
        "その他のご要望：" + payload.otherRequest
      ].join("\n");
      document.querySelector("#consultationText").value = message;
      document.querySelector("#emailFallback").hidden = false;
      formMessage.textContent = "メール作成画面を開きます。送信ボタンを押して送信してください。まだ受付完了ではありません。";
      location.href = "mailto:" + window.ComprexCatalog.config.ownerEmail +
        "?subject=" + encodeURIComponent("ホームページ制作の見積もり相談") +
        "&body=" + encodeURIComponent(message);
      return;
    }
    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "送信できませんでした。");
      if (result.redirectUrl) {
        location.href = result.redirectUrl;
      } else {
        location.href = "/web/estimate/thanks/";
      }
    } catch (error) {
      formMessage.className = "form-message error";
      formMessage.textContent = error.message || "送信できませんでした。";
    }
  });
  document.querySelector("#copyConsultation").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.querySelector("#consultationText").value);
      formMessage.textContent = "相談内容をコピーしました。web@comprex99.com 宛てに送信してください。";
    } catch {
      document.querySelector("#consultationText").select();
      formMessage.textContent = "本文を選択しました。コピーしてメールで送信してください。";
    }
  });
})();
