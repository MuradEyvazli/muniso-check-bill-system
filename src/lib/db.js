const mongoose = require("mongoose");

// Next.js dev sunucusu route'ları birbirinden izole şekilde (ilk istekte) derler.
// Bir route sadece kullandığı modelleri import ettiğinden, örn. Ticket.populate()
// "history.actorId" alanını User modeline referans veriyorsa ama o route hiç
// User'ı import etmediyse, Mongoose bu bağlantıda "User" modelinin henüz kayıtlı
// olmadığını söyleyip hata verir (MissingSchemaError) — hangi route önce
// çalıştırılırsa ona göre değişen, kafa karıştırıcı bir hata. Bunu kalıcı olarak
// önlemek için tüm modelleri burada, veritabanı bağlantısı kurulmadan önce
// merkezi olarak register ediyoruz.
require("../models/Restaurant");
require("../models/Branch");
require("../models/User");
require("../models/Hall");
require("../models/Table");
require("../models/Category");
require("../models/Product");
require("../models/OptionGroup");
require("../models/Ticket");
require("../models/Payment");
require("../models/Shift");
require("../models/CashMovement");
require("../models/Customer");
require("../models/MarketplaceOrder");
require("../models/PrinterConfig");
require("../models/Counter");
require("../models/RateLimitAttempt");

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._muniso_mongoose;
if (!cached) {
  cached = global._muniso_mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI tanımlı değil. .env dosyanıza bağlantı adresini ekleyin (.env.example'a bakın)."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
