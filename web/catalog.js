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
  { id: "seitai", label: "整体・接骨院" },
  { id: "salon", label: "美容室・ネイル" },
  { id: "food", label: "飲食店" },
  { id: "office", label: "工務店・士業・不動産" },
  { id: "school", label: "塾・教室・ジム" },
  { id: "all", label: "その他" }
];

const maintenancePlans = [
  { id: "light", name: "LIGHT 維持管理", monthly: 8000, description: "ドメイン・サーバー・SSL・契約更新管理。サイト内容の更新作業は基本的に含みません。" },
  { id: "standard", name: "STANDARD 保守管理", monthly: 12000, recommended: true, description: "LIGHTに加えてCMS管理、関連システム更新、バックアップ、基本的なセキュリティ対策。" },
  { id: "managed", name: "運用おまかせ", monthly: 25000, description: "文章・画像・商品情報・キャンペーンなど、既存ページ内の軽微な更新作業まで代行。" },
  { id: "none", name: "保守なし（買い切り）", monthly: 0, description: "買い切り制作 79,800円〜。制作・公開までで完結。公開後の保守・修正・管理は含みません。" }
];

const options = [
  { id: "normal-links", name: "LINE・SNS・外部予約リンクを入れたい", initial: 0, label: "基本込み", note: "URLや文章をいただければ、基本制作料金に含めます。", showOnSite: true },
  { id: "content-update", name: "文章・写真・メニューをしっかり載せたい", initial: 0, label: "基本込み", note: "原稿や写真が揃っていれば、通常の店舗サイトとして対応します。", showOnSite: true },
  { id: "extra-page", name: "ページを増やしたい", initial: 0, label: "追加制作 3,000円〜", note: "内容や作業量に応じて、着手前に正式な料金をご案内します。", showOnSite: true },
  { id: "booking-form", name: "予約フォーム・申込フォームを入れたい", initial: 0, label: "内容確認", note: "簡単なフォームか、予約管理まで必要かで扱いが変わります。", showOnSite: true },
  { id: "seasonal-operation", name: "季節商品やキャンペーンを定期的に更新したい", initial: 0, label: "25,000円/月向け", note: "文章・画像変更まで任せたい場合は、運用おまかせが向いています。", showOnSite: true },
  { id: "system-work", name: "決済・会員・API連携などを入れたい", initial: 0, label: "個別見積もり", note: "大きな機能追加や新規システム開発は、内容を確認して別途お見積もりします。", showOnSite: true }
];

function initialProductionFee(maintenanceId) {
  return maintenanceId && maintenanceId !== "none" ? 39800 : 79800;
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
