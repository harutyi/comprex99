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
        <strong>${item.name} / ${yen(item.monthly)} 月</strong>
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
        <span>${item.label || (item.initial ? yen(item.initial) : "基本込み")}</span>
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
    initialTotal.textContent = yen(estimate.initialTotal);
    monthlyTotal.textContent = yen(estimate.monthlyTotal);
    productionFeeNote.textContent = `基本制作 ${yen(initialProductionFee(maintenanceId))}〜 に、選んだ内容の目安を足しています。正式な料金は着手前にご案内します。`;
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
})();
