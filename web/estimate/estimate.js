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
  let requestId = crypto.randomUUID(), lastPayload = '', sending = false;
  formMessage.textContent = "相談の送信だけで契約・決済は行われません。内容確認後に正式なお見積もりをご案内します。";
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
    const seasonal = selectedOptions().includes("seasonal-operation");
    if (seasonal) form.querySelector('[name="maintenanceId"][value="managed"]').checked = true;
    form.querySelectorAll('[name="maintenanceId"]').forEach(input => {
      input.disabled = seasonal && input.value !== "managed";
    });
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
      productionFeeNote.textContent += " 定期更新を選択したため、運用代行プラン（月額25,000円）を選択しています。初期制作費は増えません。別の管理プランにする場合は、3番の定期更新のチェックを外してください。";
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
    if (sending) return;
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

    const signature = JSON.stringify(payload);
    if (lastPayload && signature !== lastPayload) requestId = crypto.randomUUID();
    lastPayload = signature;
    payload.requestId = requestId;
    sending = true;
    form.querySelector('[type="submit"]').disabled = true;
    try {
      const response = await fetch("https://api.comprex99.com/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(30000)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "送信できませんでした。");
      location.href = result.customerUrl;
    } catch (error) {
      formMessage.className = "form-message error";
      formMessage.textContent = error.message || "送信できませんでした。";
    } finally {
      sending = false;
      form.querySelector('[type="submit"]').disabled = false;
    }
  });
})();
