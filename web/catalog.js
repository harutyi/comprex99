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
  { id: "standard", name: "スタンダード", monthly: 12000, recommended: true, description: "ライト＋修正 月3回、月次アクセス確認。まずこれを標準で提案。" },
  { id: "managed", name: "運用おまかせ", monthly: 25000, description: "修正相談、更新、季節の見直しまでまとめて対応。" },
  { id: "none", name: "保守なし", monthly: 0, description: "制作のみ。公開後の保守・修正・管理は含みません。" }
];

const options = [
  { id: "contact-form", name: "問い合わせフォーム", initial: 10000, showOnSite: true },
  { id: "booking-form", name: "予約フォーム（日時選択あり）", initial: 18000, showOnSite: true },
  { id: "line-link", name: "LINE公式へのリンク・友だち追加ボタン", initial: 5000, showOnSite: true },
  { id: "external-booking", name: "外部予約サービスへのリンク", initial: 5000, showOnSite: true },
  { id: "gallery", name: "写真ギャラリー", initial: 12000, showOnSite: true },
  { id: "staff", name: "スタッフ紹介", initial: 12000, showOnSite: true },
  { id: "photo-menu", name: "メニュー表（写真付き）", initial: 15000, showOnSite: true },
  { id: "faq", name: "よくある質問（FAQ）", initial: 8000, showOnSite: true },
  { id: "voice", name: "お客様の声", initial: 8000, showOnSite: true },
  { id: "news", name: "お知らせ・新着情報", initial: 10000, showOnSite: true },
  { id: "instagram", name: "Instagram埋め込み", initial: 8000, showOnSite: true },
  { id: "extra-page", name: "ページ追加（1枚）", initial: 10000, showOnSite: true },
  { id: "recruit", name: "採用ページ", initial: 18000, showOnSite: true },
  { id: "domain-mail", name: "独自メールアドレス設定", initial: 8000, showOnSite: true },
  { id: "font-size", name: "文字サイズ変更ボタン", initial: 6000, showOnSite: true },
  { id: "before-after", name: "ビフォーアフター表示", initial: 12000, showOnSite: false, excludeIndustries: ["seitai-private", "sekkotsu", "food"] },
  { id: "insurance-page", name: "保険適用の説明ページ", initial: 12000, showOnSite: false, excludeIndustries: ["seitai-private", "salon", "food", "other"] }
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
