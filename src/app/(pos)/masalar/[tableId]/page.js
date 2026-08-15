"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import ProductGrid from "@/components/order-ticket/ProductGrid";
import TicketPanel from "@/components/order-ticket/TicketPanel";
import AddItemModal from "@/components/order-ticket/AddItemModal";
import ItemEditModal from "@/components/order-ticket/ItemEditModal";
import PaymentModal from "@/components/order-ticket/PaymentModal";
import TableActionsModal from "@/components/order-ticket/TableActionsModal";
import SplitBillModal from "@/components/order-ticket/SplitBillModal";
import HistoryModal from "@/components/order-ticket/HistoryModal";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export default function TableOrderPage() {
  const { tableId } = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();

  const { data, error, refresh } = usePolling(
    () => fetchJson(`/api/tables/${tableId}`),
    3000,
    [tableId]
  );

  const [menu, setMenu] = useState({ categories: [], products: [], optionGroups: [] });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTicket, setPaymentTicket] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [allTables, setAllTables] = useState([]);

  useEffect(() => {
    async function loadMenu() {
      const [categories, products, optionGroups] = await Promise.all([
        fetchJson("/api/categories").then((d) => d.categories),
        fetchJson("/api/products").then((d) => d.products),
        fetchJson("/api/option-groups").then((d) => d.optionGroups),
      ]);
      setMenu({ categories, products, optionGroups });
    }
    loadMenu();
  }, []);

  const loadTables = useCallback(async () => {
    const d = await fetchJson("/api/tables");
    setAllTables(d.tables);
  }, []);

  const optionGroupsById = useMemo(() => {
    const map = {};
    for (const g of menu.optionGroups) map[g._id] = g;
    return map;
  }, [menu.optionGroups]);

  const table = data?.table;
  const ticket = data?.ticket;

  // Masa boşaldıysa (ödeme tamamlandı, adisyon kapandı) ya da hiç açık adisyon yoksa
  // bu ekranda sonsuza kadar beklemek yerine kat planına geri dön. Ödeme modali
  // açıkken (fiş indirme ekranı) bu otomatik yönlendirmeyi bekletiyoruz — kullanıcı
  // "Kapat"a basana kadar ekranda kalsın, fişi indirebilsin.
  useEffect(() => {
    if (data && !data.ticket && !showPayment) {
      router.replace("/masalar");
    }
  }, [data, router, showPayment]);

  async function handleAddItem(payload) {
    await fetchJson(`/api/tickets/${ticket._id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSelectedProduct(null);
    refresh();
  }

  async function handleUpdateItem(payload) {
    await fetchJson(`/api/tickets/${ticket._id}/items/${editingItem._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setEditingItem(null);
    refresh();
  }

  async function handleDeleteItem() {
    await fetchJson(`/api/tickets/${ticket._id}/items/${editingItem._id}`, {
      method: "DELETE",
    });
    setEditingItem(null);
    refresh();
  }

  async function handlePay(targetTicket, payload) {
    const result = await fetchJson("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: targetTicket._id, ...payload }),
    });
    if (targetTicket._id === ticket?._id) refresh();
    return result;
  }

  function openMainPayment() {
    setPaymentTicket(ticket);
    setShowPayment(true);
  }

  function handleFullyPaid() {
    setShowPayment(false);
    if (paymentTicket?._id === ticket?._id) {
      router.push("/masalar");
    } else {
      refresh();
    }
  }

  async function handleMerge(targetTableId) {
    await fetchJson(`/api/tables/${tableId}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetTableId }),
    });
    refresh();
  }

  async function handleMove(targetTableId) {
    await fetchJson(`/api/tables/${tableId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetTableId }),
    });
    router.push(`/masalar/${targetTableId}`);
  }

  async function handleSplitEqual(parts) {
    return fetchJson(`/api/tickets/${ticket._id}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "equal", parts }),
    });
  }

  async function handleResetTable() {
    const activeCount = ticket.items.filter((i) => !i.isVoided).length;
    const remaining = Math.max(ticket.grandTotal - ticket.paidTotal, 0);
    const warn =
      activeCount > 0 || remaining > 0
        ? `Bu masada ${activeCount} ürün ve ${formatCurrency(remaining)} ödenmemiş tutar var. Yine de masayı boşaltmak istediğinize emin misiniz?`
        : "Masa boşaltılsın mı?";
    if (!window.confirm(warn)) return;
    await fetchJson(`/api/tables/${tableId}/reset`, { method: "POST" });
    router.push("/masalar");
  }

  async function handleSplitByItem(itemIds) {
    const result = await fetchJson(`/api/tickets/${ticket._id}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "by-item", groups: [itemIds] }),
    });
    refresh();
    return result;
  }

  if (error) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <p className="text-red-300 text-sm">Masa/adisyon yüklenemedi.</p>
        {error.message && <p className="text-white/40 text-xs max-w-sm">{error.message}</p>}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={refresh}>
            Tekrar Dene
          </Button>
          <Button variant="ghost" onClick={() => router.push("/masalar")}>
            Masalara Dön
          </Button>
        </div>
      </div>
    );
  }

  // Ödeme tamamlanınca adisyon anında kapanıp masa boşalıyor (ticket null olabilir) —
  // ama ödeme başarı ekranı (fiş indirme) hâlâ açıksa sayfayı "Yükleniyor" ile
  // değiştirip o ekranı ekrandan söküp atmayalım.
  if (!table || (!ticket && !showPayment)) {
    return <div className="text-white/40 text-center py-20">Yükleniyor…</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
      {ticket ? (
        <>
          <div className="flex-1 min-h-0 card p-4">
            <ProductGrid
              categories={menu.categories}
              products={menu.products}
              orderType={ticket.orderType}
              onSelect={setSelectedProduct}
            />
          </div>

          <div className="w-full lg:w-96 shrink-0 card p-4 flex flex-col min-h-0">
            <TicketPanel ticket={ticket} onItemClick={setEditingItem} />

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => {
                  loadTables();
                  setShowActions(true);
                }}
              >
                Masa İşlemleri
              </Button>
              <Button variant="ghost" className="text-sm" onClick={() => setShowSplit(true)}>
                Hesap Böl
              </Button>
              <Button variant="ghost" className="text-sm" onClick={() => setShowHistory(true)}>
                Geçmiş
              </Button>
              <a
                href={`/api/tickets/${ticket._id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm"
              >
                Fiş / Adisyon
              </a>
              <Button
                variant="ghost"
                className="text-sm col-span-2 !text-red-300 !border-red-900/40"
                onClick={handleResetTable}
              >
                Masayı Boşalt
              </Button>
              <Button
                variant="gold"
                className="text-sm col-span-2"
                disabled={ticket.items.filter((i) => !i.isVoided).length === 0}
                onClick={openMainPayment}
              >
                Ödeme Al
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
          Ödeme tamamlandı — fişi indirebilirsiniz.
        </div>
      )}

      <AddItemModal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        optionGroupsById={optionGroupsById}
        orderType={ticket?.orderType}
        onConfirm={handleAddItem}
      />

      <ItemEditModal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        role={user?.role}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
      />

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        ticket={paymentTicket}
        onPay={(payload) => handlePay(paymentTicket, payload)}
        onFullyPaid={handleFullyPaid}
      />

      <TableActionsModal
        open={showActions}
        onClose={() => setShowActions(false)}
        tables={allTables}
        currentTableId={tableId}
        onMerge={handleMerge}
        onMove={handleMove}
      />

      <SplitBillModal
        open={showSplit}
        onClose={() => setShowSplit(false)}
        ticket={ticket}
        onSplitEqual={handleSplitEqual}
        onSplitByItem={handleSplitByItem}
      />

      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={ticket?.history}
      />
    </div>
  );
}
