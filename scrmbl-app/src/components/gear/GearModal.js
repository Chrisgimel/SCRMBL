import React, { useState, useMemo } from "react";
import { LinkIcon, Trash2 } from "lucide-react";
import Sheet from "../modals/Sheet";
import Chip from "../ui/Chip";
import { THEME, GEAR_SLOTS, GEAR_SOURCES, SLOT } from "../../constants";
import { uid } from "../../utils/helpers";
import { readProductLink } from "../../utils/retailers";

function GearModal({ item, onClose, onSave, onRemove }) {
  const [name, setName] = useState(item.name || "");
  const [brand, setBrand] = useState(item.brand || "");
  const [price, setPrice] = useState(item.price ?? "");
  const [source, setSource] = useState(item.source || "REI");
  const [slot, setSlot] = useState(item.slot || "other");
  const [url, setUrl] = useState(item.url || "");
  const link = useMemo(() => readProductLink(url), [url]);
  const dirty = name !== (item.name || "") || brand !== (item.brand || "") || url !== (item.url || "");

  return (
    <Sheet title={item.id ? "Edit gear" : "Add gear"} onClose={onClose} dirty={dirty}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {onRemove && <button className="outline-btn" style={{ flex: 1 }} onClick={onRemove}><Trash2 size={15} style={{ verticalAlign: -2 }} /> Remove</button>}
          <button className="primary-btn" style={{ flex: 2 }} disabled={!name.trim()}
            onClick={() => onSave({
              id: item.id || uid("g"), slot, name: name.trim(), brand: brand.trim(),
              price, source, url: url.trim(), featured: item.featured ?? SLOT[slot].worn,
            })}>
            Save to locker
          </button>
        </div>
      }>
      <label className="field-label" htmlFor="g-name">Item name</label>
      <input id="g-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Beta AR Jacket" />
      <label className="field-label" htmlFor="g-brand">Brand</label>
      <input id="g-brand" className="field" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Arc'teryx" />

      <label className="field-label">Category</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {GEAR_SLOTS.map((s) => <Chip key={s.id} on={slot === s.id} onClick={() => setSlot(s.id)}>{s.label}</Chip>)}
      </div>

      <label className="field-label" htmlFor="g-price">Price paid (USD)</label>
      <input id="g-price" className="field" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />

      <label className="field-label">Bought from</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {GEAR_SOURCES.map((s) => <Chip key={s} on={source === s} onClick={() => setSource(s)}>{s}</Chip>)}
      </div>

      <label className="field-label" htmlFor="g-url"><LinkIcon size={12} style={{ verticalAlign: -1 }} /> Product link (optional)</label>
      <input id="g-url" className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an REI / Amazon URL" />
      {link && (
        link.ok ? (
          <div className="link-note">
            <div style={{ color: THEME.mintLight, fontWeight: 700, fontSize: 12 }}>
              {link.known ? `Recognized: ${link.retailer}` : `Link saved: ${link.retailer}`}
            </div>
            {link.guess && (
              <button className="tiny-btn" style={{ marginTop: 6 }} onClick={() => setName(link.guess)}>
                Use “{link.guess}” as the name
              </button>
            )}
            <div style={{ color: THEME.gray, fontSize: 11.5, marginTop: 6, lineHeight: 1.45 }}>
              Name and price are read from the address, not from {link.retailer}. Live pricing and photos need a retailer API key — that's the next build.
            </div>
          </div>
        ) : (
          <div className="link-note" style={{ borderColor: "#8A3B3B" }}>
            <div style={{ color: "#E8A0A0", fontSize: 12 }}>{link.reason}</div>
          </div>
        )
      )}
    </Sheet>
  );
}

export default GearModal;
