import { ROLES } from "./constants";

// Aksiyon -> izinli roller. admin her zaman tüm aksiyonlara erişebilir.
const PERMISSIONS = {
  "tables:view": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON],
  "tables:manage": [ROLES.ADMIN],
  "tickets:view": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON, ROLES.MUTFAK],
  "tickets:create": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON],
  "tickets:edit-items": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON],
  "tickets:void": [ROLES.ADMIN, ROLES.KASIYER],
  "tickets:discount": [ROLES.ADMIN, ROLES.KASIYER],
  "tickets:comp": [ROLES.ADMIN, ROLES.KASIYER],
  "tickets:merge-move-split": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON],
  "tickets:close": [ROLES.ADMIN, ROLES.KASIYER],
  "payments:process": [ROLES.ADMIN, ROLES.KASIYER],
  "shifts:open": [ROLES.ADMIN, ROLES.KASIYER],
  "shifts:close": [ROLES.ADMIN, ROLES.KASIYER],
  "shifts:cash-movement": [ROLES.ADMIN, ROLES.KASIYER],
  "menu:manage": [ROLES.ADMIN],
  "menu:stock-toggle": [ROLES.ADMIN, ROLES.KASIYER],
  "kds:view": [ROLES.ADMIN, ROLES.MUTFAK, ROLES.KASIYER],
  "kds:update-status": [ROLES.ADMIN, ROLES.MUTFAK],
  "customers:manage": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON],
  "reports:view": [ROLES.ADMIN],
  "reports:today": [ROLES.ADMIN, ROLES.KASIYER, ROLES.GARSON],
  "reports:manage": [ROLES.ADMIN],
  "tables:reset": [ROLES.ADMIN, ROLES.KASIYER],
  "users:manage": [ROLES.ADMIN],
  "settings:manage": [ROLES.ADMIN],
};

export function can(role, action) {
  if (role === ROLES.ADMIN) return true;
  const allowed = PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function assertPermission(role, action) {
  if (!can(role, action)) {
    const err = new Error("Bu işlem için yetkiniz yok");
    err.status = 403;
    throw err;
  }
}

export default PERMISSIONS;
