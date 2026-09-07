const config = {
  AUTO_CHECKOUT: false,
  currency: "jpy",
  ownerEmail: "web@comprex99.com",
  business: {
    name: "Comprex99",
    representative: "加藤 晴士",
    address: "愛知県",
    email: "web@comprex99.com"
  }
};

const industries = [
  { id: "seitai-private", label: "整体院（民間資格）" },
  { id: "sekkotsu", label: "接骨院（国家資格）" },
  { id: "salon", label: "美容室・ネイル" },
  { id: "food", label: "飲食" },
  { id: "other", label: "その他" }
];

const maintenancePlans = [
  { id: "light", name: "ライト", monthly: 5500, description: "サーバー・ドメイン管理、SSL更新、バックアップ、軽微な修正 月1回。" },
  { id: "standard", name: "スタンダード", monthly: 12000, recommended: true, description: "修正 月3回、Google投稿代行、写真差し替え、月次レポート。" },
  { id: "managed", name: "運用おまかせ", monthly: 25000, description: "更新多め、ページ追加、週1投稿、電話・LINE相談。" },
  { id: "none", name: "保守なし", monthly: 0, description: "制作のみ。公開後の保守・修正・管理は含みません。" }
];

const options = [
  { id: "booking-form", name: "予約フォーム（日時選択あり）", initial: 15000, showOnSite: true },
  { id: "line-link", name: "LINE友だち追加ボタン", initial: 5000, showOnSite: true },
  { id: "recruit", name: "採用ページ", initial: 25000, showOnSite: true }
];

function initialProductionFee(maintenanceId) {
  return maintenanceId && maintenanceId !== "none" ? 19800 : 39800;
}

function visibleOptions(industryId) {
  return options.filter((item) => item.showOnSite && !(item.excludeIndustries || []).includes(industryId));
}

function calculateEstimate(input = {}) {
  const industry = industries.find((item) => item.id === input.industryId) || industries[0];
  const maintenance = maintenancePlans.find((item) => item.id === input.maintenanceId) || maintenancePlans.find((item) => item.recommended);
  const allowed = new Set(visibleOptions(industry.id).map((item) => item.id));
  const selectedOptions = (input.optionIds || [])
    .filter((id) => allowed.has(id))
    .map((id) => options.find((item) => item.id === id))
    .filter(Boolean);
  const productionFee = initialProductionFee(maintenance.id);
  const optionsTotal = selectedOptions.reduce((sum, item) => sum + item.initial, 0);
  return {
    industry,
    maintenance,
    selectedOptions,
    productionFee,
    optionsTotal,
    initialTotal: productionFee + optionsTotal,
    monthlyTotal: maintenance.monthly
  };
}

const api = { config, industries, maintenancePlans, options, initialProductionFee, visibleOptions, calculateEstimate };

if (typeof module !== "undefined") module.exports = api;
if (typeof window !== "undefined") window.ComprexCatalog = api;
