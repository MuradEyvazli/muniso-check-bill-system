"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ROLE_LABELS, ROLES } from "@/lib/constants";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

const TABS = [
  { key: "users", label: "Kullanıcılar" },
  { key: "tables", label: "Masalar" },
  { key: "restaurant", label: "Restoran / Şube" },
];

export default function AyarlarPage() {
  const [tab, setTab] = useState("users");

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tap-target rounded-xl2 px-5 text-sm font-semibold border ${
              tab === t.key
                ? "bg-burgundy border-burgundy text-white"
                : "bg-ink-card border-ink-border text-white/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "tables" && <TablesTab />}
      {tab === "restaurant" && <RestaurantTab />}
    </div>
  );
}

function TablesTab() {
  const [halls, setHalls] = useState([]);
  const [tables, setTables] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = useCallback(async () => {
    const [h, t] = await Promise.all([
      fetchJson("/api/halls").then((d) => d.halls),
      fetchJson("/api/tables").then((d) => d.tables),
    ]);
    setHalls(h);
    setTables(t);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const tableNum = (name) => {
    const match = String(name || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-white/40 text-xs">
        Masa eklemek için Masalar sayfasındaki &ldquo;+ Masa Ekle&rdquo; butonunu kullanın. Bir
        masayı kalıcı olarak silmek için buradan, sadece masa boşken ve silme şifresiyle
        yapabilirsiniz.
      </p>
      {halls.map((hall) => {
        const hallTables = tables
          .filter((t) => t.hallId === hall._id)
          .sort((a, b) => tableNum(a.name) - tableNum(b.name));
        if (hallTables.length === 0) return null;
        return (
          <div key={hall._id} className="flex flex-col gap-2">
            <h3 className="font-display text-white/70 text-sm font-semibold">{hall.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {hallTables.map((t) => {
                const bos = t.status === "bos";
                return (
                  <div
                    key={t._id}
                    className="card px-3 py-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-white text-sm font-semibold">{t.name}</div>
                      <div className={`text-[11px] ${bos ? "text-white/35" : "text-gold"}`}>
                        {bos ? "Boş" : "Dolu"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-xs !text-red-300 !border-red-900/40 shrink-0"
                      disabled={!bos}
                      title={bos ? "" : "Masa dolu olduğu için silinemez"}
                      onClick={() => setDeleteTarget(t)}
                    >
                      Sil
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {halls.every((h) => tables.filter((t) => t.hallId === h._id).length === 0) && (
        <p className="text-white/30 text-center py-8">Henüz masa yok.</p>
      )}

      <DeleteTableModal
        table={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          reload();
        }}
      />
    </div>
  );
}

function DeleteTableModal({ table, onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPassword("");
    setError("");
  }, [table]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await fetchJson(`/api/tables/${table._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: password }),
      });
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!table} onClose={onClose} title={`${table?.name || ""} Sil`} size="sm">
      <div className="flex flex-col gap-3">
        <p className="text-red-300 text-sm font-semibold">
          Bu masa kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek için silme
          şifresini girin.
        </p>
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input
          type="password"
          className="input-field"
          placeholder="Silme şifresi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          className="!bg-red-700 hover:!bg-red-600"
          disabled={loading || !password}
          onClick={submit}
        >
          {loading ? "Siliniyor…" : "Masayı Kalıcı Olarak Sil"}
        </Button>
      </div>
    </Modal>
  );
}

function UsersTab() {
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const reload = useCallback(async () => {
    const d = await fetchJson("/api/users");
    setUsers(d.users);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      <Button variant="gold" className="self-start" onClick={() => setAddOpen(true)}>
        + Yeni Kullanıcı
      </Button>

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u._id} className="card px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                {u.name} {u.surname}
                {!u.isActive && <Badge tone="danger">Pasif</Badge>}
                {u._id === currentUser?.sub && <Badge tone="neutral">Siz</Badge>}
              </div>
              <div className="text-white/40 text-xs">
                @{u.username} · {ROLE_LABELS[u.role] || u.role}
              </div>
            </div>
            <Button variant="ghost" className="text-xs" onClick={() => setEditing(u)}>
              Düzenle
            </Button>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-white/30 text-center py-8">Kullanıcı bulunamadı.</p>
        )}
      </div>

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={reload} />
      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}
    </div>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
      {Object.values(ROLES).map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

function AddUserModal({ open, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(ROLES.GARSON);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setSurname("");
    setUsername("");
    setPassword("");
    setPin("");
    setRole(ROLES.GARSON);
    setError("");
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await fetchJson("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, surname, username, password, pin, role }),
      });
      onSaved();
      reset();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni Kullanıcı" size="sm">
      <div className="flex flex-col gap-3">
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input className="input-field" placeholder="Ad" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input-field"
          placeholder="Soyad"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="PIN (4 haneli)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
        />
        <RoleSelect value={role} onChange={setRole} />
        <Button variant="gold" disabled={loading} onClick={submit}>
          {loading ? "Oluşturuluyor…" : "Kullanıcıyı Oluştur"}
        </Button>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = { role, isActive };
      if (password) payload.password = password;
      if (pin) payload.pin = pin;
      await fetchJson(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`${user.name} ${user.surname || ""}`} size="sm">
      <div className="flex flex-col gap-3">
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <div>
          <div className="text-white/40 text-xs mb-1">Rol</div>
          <RoleSelect value={role} onChange={setRole} />
        </div>
        <label className="flex items-center justify-between tap-target">
          <span className="text-white/70 text-sm">Aktif</span>
          <input
            type="checkbox"
            className="w-6 h-6 accent-gold"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        </label>
        <div>
          <div className="text-white/40 text-xs mb-1">Yeni Şifre (opsiyonel)</div>
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Değiştirmek için doldurun"
          />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1">Yeni PIN (opsiyonel)</div>
          <input
            className="input-field"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Değiştirmek için doldurun"
            maxLength={6}
          />
        </div>
        <Button variant="gold" disabled={loading} onClick={submit}>
          {loading ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </Modal>
  );
}

function RestaurantTab() {
  const [restaurant, setRestaurant] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [ticketResetOpen, setTicketResetOpen] = useState(false);
  const [counterValue, setCounterValue] = useState(null);
  const [occupiedCount, setOccupiedCount] = useState(null);

  const reloadCounterInfo = useCallback(async () => {
    const [counterData, tablesData] = await Promise.all([
      fetchJson("/api/settings/ticket-counter"),
      fetchJson("/api/tables"),
    ]);
    setCounterValue(counterData.value);
    setOccupiedCount((tablesData.tables || []).filter((t) => t.status !== "bos").length);
  }, []);

  useEffect(() => {
    fetchJson("/api/settings").then((d) => {
      setRestaurant(d.restaurant);
      setBranch(d.branch);
    });
    reloadCounterInfo();
  }, [reloadCounterInfo]);

  async function submit() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      await fetchJson("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant: { name: restaurant.name },
          branch: { name: branch.name, address: branch.address, phone: branch.phone },
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!restaurant || !branch) {
    return <p className="text-white/40">Yükleniyor…</p>;
  }

  return (
    <div className="card p-5 flex flex-col gap-3 max-w-lg">
      {error && <div className="text-red-300 text-sm">{error}</div>}
      {saved && <div className="text-emerald-300 text-sm">Kaydedildi.</div>}

      <div>
        <div className="text-white/40 text-xs mb-1">Restoran Adı</div>
        <input
          className="input-field"
          value={restaurant.name}
          onChange={(e) => setRestaurant((r) => ({ ...r, name: e.target.value }))}
        />
      </div>
      <div>
        <div className="text-white/40 text-xs mb-1">Şube Adı</div>
        <input
          className="input-field"
          value={branch.name}
          onChange={(e) => setBranch((b) => ({ ...b, name: e.target.value }))}
        />
      </div>
      <div>
        <div className="text-white/40 text-xs mb-1">Adres</div>
        <input
          className="input-field"
          value={branch.address || ""}
          onChange={(e) => setBranch((b) => ({ ...b, address: e.target.value }))}
        />
      </div>
      <div>
        <div className="text-white/40 text-xs mb-1">Telefon</div>
        <input
          className="input-field"
          value={branch.phone || ""}
          onChange={(e) => setBranch((b) => ({ ...b, phone: e.target.value }))}
        />
      </div>
      <Button variant="gold" disabled={loading} onClick={submit}>
        {loading ? "Kaydediliyor…" : "Kaydet"}
      </Button>

      <div className="border-t border-red-900/30 mt-2 pt-4">
        <h3 className="text-red-300 font-bold text-sm mb-1.5">Tehlikeli Bölge</h3>
        <p className="text-white/50 text-xs mb-3">
          Adisyon numaralarını sıfırlar — bir sonraki açılan adisyon 1 numaradan başlar. Geçmiş
          adisyonların numaraları değişmez.
        </p>

        <div className="rounded-xl2 bg-ink-soft border border-ink-border px-4 py-3 mb-3 flex flex-col gap-1">
          <div className="text-white/70 text-sm">
            Şu anki sayaç: <span className="font-display text-gold">{counterValue ?? "…"}</span>
            {" "}— bir sonraki <b>yeni</b> adisyon #{(counterValue ?? 0) + 1} olacak.
          </div>
          {occupiedCount !== null && occupiedCount > 0 && (
            <div className="text-gold/80 text-xs">
              ⚠ Şu anda {occupiedCount} masa boş değil. Onlardaki eski adisyonların numarası
              (varsa) sıfırlamadan etkilenmez — sadece yeni açacağınız adisyonlar 1&apos;den
              başlar. Test için önce onları &ldquo;Masayı Boşalt&rdquo; ile temizleyin.
            </div>
          )}
        </div>

        <Button
          className="!bg-red-700 hover:!bg-red-600 text-sm"
          onClick={() => setTicketResetOpen(true)}
        >
          Adisyon Numarasını Sıfırla
        </Button>
      </div>

      <TicketCounterResetModal
        open={ticketResetOpen}
        onClose={() => setTicketResetOpen(false)}
        onReset={reloadCounterInfo}
      />
    </div>
  );
}

function TicketCounterResetModal({ open, onClose, onReset }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [newValue, setNewValue] = useState(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setDone(false);
      setNewValue(null);
    }
  }, [open]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson("/api/settings/ticket-counter/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: password }),
      });
      setNewValue(data.value);
      setDone(true);
      onReset?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adisyon Numarasını Sıfırla" size="sm">
      <div className="flex flex-col gap-3">
        {done ? (
          <>
            <p className="text-emerald-300 text-sm">
              Sayaç sıfırlandı — veritabanındaki güncel değer: <b>{newValue}</b>. Bir sonraki
              açılan yeni adisyon #{(newValue ?? 0) + 1} olacak. (Zaten açık, eski adisyonların
              numarası bundan etkilenmez.)
            </p>
            <Button variant="ghost" onClick={onClose}>
              Kapat
            </Button>
          </>
        ) : (
          <>
            <p className="text-red-300 text-sm font-semibold">
              Bir sonraki yeni adisyon 1 numaradan başlayacak. Geçmiş adisyon numaraları
              değişmez. Devam etmek için silme şifresini girin.
            </p>
            {error && <div className="text-red-300 text-sm">{error}</div>}
            <input
              type="password"
              className="input-field"
              placeholder="Silme şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="!bg-red-700 hover:!bg-red-600"
              disabled={loading || !password}
              onClick={submit}
            >
              {loading ? "Sıfırlanıyor…" : "Sayacı Sıfırla"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
