(function (root) {
  const plans = {
    omakase: { name: "ホームページ制作｜おまかせ制作", amount: 39800, mode: "payment", url: "https://buy.stripe.com/fZu28q1z10Z82uI4o1ds404" },
    outright: { name: "ホームページ制作｜買い切り制作", amount: 79800, mode: "payment", url: "https://buy.stripe.com/28EdR8gtVdLUc5i5s5ds405" },
    basic: { name: "ホームページ保守｜基本管理プラン", amount: 8000, mode: "subscription", url: "https://buy.stripe.com/eVQbJ05Ph4bk7P2aMpds406" },
    support: { name: "ホームページ保守｜運用サポートプラン", amount: 12000, mode: "subscription", url: "https://buy.stripe.com/fZueVcdhJ6js8T6dYBds407" },
    managed: { name: "ホームページ保守｜運用代行プラン", amount: 25000, mode: "subscription", url: "https://buy.stripe.com/7sYdR80uXcHQ0mAcUxds408" }
  };
  if (typeof module !== "undefined") module.exports = plans;
  else root.ComprexPlans = plans;
})(typeof window !== "undefined" ? window : globalThis);
