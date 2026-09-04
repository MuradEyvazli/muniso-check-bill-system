"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import ProductGrid from "@/components/order-ticket/ProductGrid";
import TicketPanel from "@/components/order-ticket/TicketPanel";
import AddItemModal from "@/components/order-ticket/AddItemModal";
import ItemEditModal from "@/components/order-ticket/ItemEditModal";
import PaymentModal from "@/components/order-ticket/PaymentModal";
import HistoryModal from "@/components/order-ticket/HistoryModal";
import Button from "@/components/ui/Button";
import { SkeletonBlock } from "@/components/ui/Skeleton";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

/**
 * Masaya bağlı olmayan (paket servis / gel-al) siparişler için ortak sipariş ekranı.
 */
export default function SimpleOrderScreen({ ticketId, backHref }) {
  const router = useRouter();
  const { user } = useCurrentUser();

  const { data, error, refresh } = usePolling(
    () => fetchJson(`/api/tickets/${ticketId}`),
    3000,
    [ticketId]
  );
  const ticket = data?.ticket;

  const [menu, setMenu] = useState({ categories: [], products: [], optionGroups: [] });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  // Ödeme akışı başladığında adisyonun anlık bir kopyasını dondurup PaymentModal'a
  // onu veriyoruz — ödeme tamamlanıp canlı `ticket` null'a düşse bile (masa/adisyon
  // kapanınca) modal'daki "Ödeme Tamamlandı" ekranı bundan etkilenmesin diye.
  const [paymentTicket, setPaymentTicket] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Sipariş kapandıysa (ödeme tamamlandı) ya da hiç açık adisyon yoksa geri dön.
  // Ödeme modali açıkken (fiş indirme ekranı) bu otomatik yönlendirmeyi bekletiyoruz —
  // kullanıcı "Kapat"a basana kadar ekranda kalsın, fişi indirebilsin.
  useEffect(() => {
    if (data && !data.ticket && !showPayment) {
      router.replace(backHref);
    }
  }, [data, router, backHref, showPayment]);

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

  const optionGroupsById = useMemo(() => {
    const map = {};
    for (const g of menu.optionGroups) map[g._id] = g;
    return map;
  }, [menu.optionGroups]);

  async function handleAddItem(payload) {
    await fetchJson(`/api/tickets/${ticketId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSelectedProduct(null);
    refresh();
  }

  async function handleUpdateItem(payload) {
    await fetchJson(`/api/tickets/${ticketId}/items/${editingItem._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setEditingItem(null);
    refresh();
  }

  async function handleDeleteItem() {
    await fetchJson(`/api/tickets/${ticketId}/items/${editingItem._id}`, {
      method: "DELETE",
    });
    setEditingItem(null);
    refresh();
  }

  async function handlePay(payload) {
    const result = await fetchJson("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, ...payload }),
    });
    refresh();
    return result;
  }

  function handleFullyPaid() {
    setShowPayment(false);
    router.push(backHref);
  }

  if (error) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <p className="text-red-300 text-sm">Adisyon yüklenemedi.</p>
        {error.message && <p className="text-white/40 text-xs max-w-sm">{error.message}</p>}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={refresh}>
            Tekrar Dene
          </Button>
          <Button variant="ghost" onClick={() => router.push(backHref)}>
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket && !showPayment) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
        <div className="lg:w-96 shrink-0 flex flex-col gap-3">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-10 w-2/3" />
          <SkeletonBlock className="flex-1" />
        </div>
      </div>
    );
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
            {ticket.deliveryAddress?.addressText && (
              <div className="mb-3 rounded-xl2 bg-ink-soft border border-ink-border p-3 text-sm">
                <div className="text-white/40 text-xs uppercase font-semibold mb-1">Teslimat Adresi</div>
                <div className="text-white">{ticket.deliveryAddress.addressText}</div>
                {ticket.deliveryAddress.note && (
                  <div className="text-white/40 text-xs mt-1">{ticket.deliveryAddress.note}</div>
                )}
              </div>
            )}

            <TicketPanel ticket={ticket} onItemClick={setEditingItem} />

            <div className="grid grid-cols-2 gap-2 mt-3">
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
                variant="gold"
                className="text-sm col-span-2"
                disabled={ticket.items.filter((i) => !i.isVoided).length === 0}
                onClick={() => {
                  setPaymentTicket(ticket);
                  setShowPayment(true);
                }}
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
        onPay={handlePay}
        onFullyPaid={handleFullyPaid}
        role={user?.role}
      />

      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={ticket?.history}
      />
    </div>
  );
}
