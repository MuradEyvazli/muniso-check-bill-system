import { jsonError } from "@/lib/apiUtils";

// Mutfak (KDS) ekranı kaldırıldı — bu uç nokta artık devre dışı.
export async function GET() {
  return jsonError("Bu özellik kaldırıldı", 404);
}
