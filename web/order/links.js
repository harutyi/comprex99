document.querySelectorAll("[data-production-plan]").forEach(link => {
  const plan = window.ComprexPlans[link.dataset.productionPlan];
  if (!plan) return;
  link.href = plan.url;
});
