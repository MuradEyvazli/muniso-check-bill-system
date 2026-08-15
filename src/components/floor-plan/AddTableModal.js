"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function AddTableModal({ open, onClose, hallId, onCreated }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, hallId, capacity: Number(capacity) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setName("");
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni Masa Ekle" size="sm">
      <div className="flex flex-col gap-3">
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input
          className="input-field"
          placeholder="Masa adı (ör. S11)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-field"
          type="number"
          placeholder="Kapasite"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Button variant="gold" onClick={submit} disabled={loading || !name}>
          {loading ? "Ekleniyor…" : "Masa Ekle"}
        </Button>
      </div>
    </Modal>
  );
}
