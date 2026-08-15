const ROLES = {
  ADMIN: "admin",
  KASIYER: "kasiyer",
  GARSON: "garson",
  MUTFAK: "mutfak",
};

const ROLE_LABELS = {
  admin: "Yönetici",
  kasiyer: "Kasiyer",
  garson: "Garson",
  mutfak: "Mutfak",
};

const TABLE_STATUS = {
  BOS: "bos",
  DOLU: "dolu",
  ODEME_BEKLIYOR: "odeme_bekliyor",
};

const TABLE_STATUS_LABELS = {
  bos: "Boş",
  dolu: "Dolu",
  odeme_bekliyor: "Ödeme Bekliyor",
};

const ORDER_TYPES = {
  MASA: "masa",
  PAKET: "paket",
  GEL_AL: "gel_al",
};

const ORDER_TYPE_LABELS = {
  masa: "Masa",
  paket: "Paket Servis",
  gel_al: "Gel-Al",
};

const TICKET_STATUS = {
  ACIK: "acik",
  KAPANDI: "kapandi",
  IPTAL: "iptal",
};

const KDS_STATUS = {
  YENI: "yeni",
  HAZIRLANIYOR: "hazirlaniyor",
  HAZIR: "hazir",
};

const KDS_STATUS_LABELS = {
  yeni: "Yeni",
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
};

const PREP_STATIONS = {
  MUTFAK: "mutfak",
  BAR: "bar",
  TATLI: "tatli",
};

const PREP_STATION_LABELS = {
  mutfak: "Mutfak",
  bar: "Bar",
  tatli: "Tatlı",
};

const PAYMENT_METHODS = {
  NAKIT: "nakit",
  KREDI_KARTI: "kredi_karti",
  YEMEK_KARTI_MULTINET: "yemek_karti_multinet",
  YEMEK_KARTI_SODEXO: "yemek_karti_sodexo",
  YEMEK_KARTI_TICKET: "yemek_karti_ticket",
};

const PAYMENT_METHOD_LABELS = {
  nakit: "Nakit",
  kredi_karti: "Kredi Kartı",
  yemek_karti_multinet: "Multinet",
  yemek_karti_sodexo: "Sodexo",
  yemek_karti_ticket: "Ticket",
};

const DISCOUNT_TYPES = {
  PERCENT: "percent",
  AMOUNT: "amount",
};

const PRICE_LISTS = ["salon", "paket", "gelAl", "marketplace"];

const VOID_REASONS = [
  "Müşteri vazgeçti",
  "Yanlış girildi",
  "Stok yok",
  "Mutfak hatası",
  "Diğer",
];

const CASH_MOVEMENT_TYPES = {
  GIRIS: "giris",
  CIKIS: "cikis",
};

const MARKETPLACE_PROVIDERS = {
  MOCK: "mock",
  YEMEKSEPETI: "yemeksepeti",
  GETIR: "getir",
  TRENDYOL: "trendyol",
};

const CURRENCY_SYMBOL = "₺";

module.exports = {
  ROLES,
  ROLE_LABELS,
  TABLE_STATUS,
  TABLE_STATUS_LABELS,
  ORDER_TYPES,
  ORDER_TYPE_LABELS,
  TICKET_STATUS,
  KDS_STATUS,
  KDS_STATUS_LABELS,
  PREP_STATIONS,
  PREP_STATION_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  DISCOUNT_TYPES,
  PRICE_LISTS,
  VOID_REASONS,
  CASH_MOVEMENT_TYPES,
  MARKETPLACE_PROVIDERS,
  CURRENCY_SYMBOL,
};
