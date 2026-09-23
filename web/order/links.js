document.querySelectorAll("[data-production-plan]").forEach(link => {
  const plan = window.ComprexPlans[link.dataset.productionPlan];
  if (!plan) return;
  link.href = plan.url;
  link.addEventListener("click", event => {
    const terms = link.dataset.productionPlan === "omakase" ? "制作費39,800円のお支払いです。公開後は月額8,000円以上・12ヶ月の管理契約が必要です。" : "制作費79,800円のお支払いです。月額の管理契約は必須ではありません。";
    if (!confirm(`${terms}\n制作内容について合意済みの場合のみ、Stripeの決済ページへお進みください。`)) event.preventDefault();
  });
});
