import React, { useState } from "react";
import { Plus, Tag, Package, Layers } from "lucide-react";
import UnderlineTabs from "../components/ui/UnderlineTabs";
import Empty from "../components/ui/Empty";
import { COPY, GEAR_SLOTS, SLOT, THEME, WORN_SLOTS } from "../constants";
import { readProductLink } from "../utils/retailers";
import { photoSrc } from "../utils/helpers";
import { GEAR_SLOT_ICONS } from "../assets/gearIcons";
import Polaroid from "../components/ui/Polaroid";
import GearModal from "../components/gear/GearModal";
import KitModal from "../components/gear/KitModal";

// Deterministic per-item tilt so the scatter reads as photos dropped on a
// table rather than a rigid grid, without jittering between re-renders.
// Keyed on the slot id (not the gear id) so a tile keeps its angle when the
// item in it changes.
function rotationFor(id) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return ((h % 9) - 4) * 1.1; // about -4.4..4.4 degrees
}

// Polaroids sit in a 2-up flow at a fixed pixel width — never a percentage —
// so a large source image can't feed back into layout the way it did when
// these were auto-sized grid cells.
const POLAROID_W = 148;

function GearScreen({ state, onSell, toast, saveGear, removeGear, toggleFeature, saveKit, removeKit }) {
  const [tab, setTab] = useState("Loadout");
  const [editing, setEditing] = useState(null);
  const [editingKit, setEditingKit] = useState(null);
  const featured = state.gear.filter((g) => g.featured && SLOT[g.slot]?.worn);
  const total = state.gear.reduce((a, g) => a + (Number(g.price) || 0), 0);
  // Worn slots split into the ones with something in them (rendered as
  // polaroids) and the ones still empty (rendered as compact add-chips).
  const wornSlotItems = WORN_SLOTS.map((s) => {
    const items = state.gear.filter((g) => g.slot === s.id);
    const shown = items.find((g) => g.featured) || items[0];
    return { s, shown, extra: items.length > 1 ? ` +${items.length - 1}` : "" };
  });
  const worn = wornSlotItems.filter((x) => x.shown);
  const emptySlots = wornSlotItems.filter((x) => !x.shown).map((x) => x.s);
  const usedIn = (id) => state.logs.filter((l) => (l.gear || []).includes(id)).length;
  const kits = state.kits || [];

  // Toasts wait on the save so a failed sync can't report success
  const save = async (item) => {
    setEditing(null);
    const ok = await saveGear(item);
    toast(ok ? `${item.name} saved to your locker` : `Couldn't save ${item.name}`, !ok);
  };
  const remove = async (id) => {
    setEditing(null);
    const ok = await removeGear(id);
    if (!ok) toast("Couldn't remove that item", true);
  };

  const onSaveKit = async (kit) => {
    setEditingKit(null);
    const ok = await saveKit(kit);
    toast(ok ? `${kit.name} saved` : `Couldn't save ${kit.name}`, !ok);
  };
  const onRemoveKit = async (id) => {
    setEditingKit(null);
    const ok = await removeKit(id);
    if (!ok) toast("Couldn't remove that kit", true);
  };

  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, letterSpacing: 3, color: THEME.grayLight, textAlign: "center" }}>GEAR</div>
        <div style={{ marginTop: 14 }}>
          <UnderlineTabs tabs={["Loadout", "Locker", "Kits"]} active={tab} onChange={setTab} />
        </div>
      </div>

      {tab === "Loadout" && (
        <>
          {/* Only kitted slots get a polaroid — five empty white frames would
              drown out the two real ones. Unfilled slots drop to add-chips. */}
          {worn.length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", justifyContent: "center",
              columnGap: 6, rowGap: 18, padding: "22px 16px 6px",
            }}>
              {worn.map(({ s, shown, extra }, i) => (
                <button key={s.id} onClick={() => setEditing(shown)}
                  className="polaroid-btn"
                  aria-label={`${s.label}: ${shown.name}`}
                  style={{ marginTop: i % 2 ? 16 : 0 }}>
                  <Polaroid
                    width={POLAROID_W}
                    rotate={rotationFor(s.id)}
                    fit="contain"
                    src={shown.image ? photoSrc(shown.image) : null}
                    alt={shown.name}
                    caption={shown.name + extra}
                    sub={s.label}
                  >
                    <div style={{ color: "#C2C7BE" }}>{GEAR_SLOT_ICONS[s.id]}</div>
                  </Polaroid>
                </button>
              ))}
            </div>
          )}

          {emptySlots.length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7,
              padding: worn.length ? "14px 20px 2px" : "22px 20px 2px",
            }}>
              {emptySlots.map((s) => (
                <button key={s.id} className="slot-chip" onClick={() => setEditing({ slot: s.id })}
                  aria-label={`Add ${s.label}`}>
                  <Plus size={12} strokeWidth={3} /> {s.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ margin: "14px 24px 6px", background: THEME.sageDeep, borderRadius: 18, padding: "14px 18px", textAlign: "center", color: THEME.grayLight }}>
            {featured.length === 0 ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{COPY.gearEmpty}</div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>{COPY.gearEmptyCta}</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{featured.length}/{WORN_SLOTS.length} slots kitted</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Locker value ~ ${total.toLocaleString()}</div>
              </>
            )}
          </div>
        </>
      )}

      {tab === "Locker" && (
        <div style={{ padding: "16px 18px 18px" }}>
          <div style={{ color: THEME.textDim, fontSize: 12, marginBottom: 14, lineHeight: 1.45 }}>
            Everything you own. Attach any of it to a hike when you log it, feature it on your loadout, or list it for sale.
          </div>
          {GEAR_SLOTS.map((s) => {
            const items = state.gear.filter((g) => g.slot === s.id);
            if (!items.length) return null;
            return (
              <div key={s.id} style={{ marginBottom: 16 }}>
                <div style={{ color: THEME.mintLight, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((g) => {
                    const link = readProductLink(g.url);
                    const n = usedIn(g.id);
                    return (
                      <div key={g.id} className="rank-card" style={{ alignItems: "flex-start" }}>
                        {g.image && (
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: THEME.canvas, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                            <img src={photoSrc(g.image)} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                          <div style={{ color: THEME.gray, fontSize: 12 }}>
                            {g.brand}{g.price ? ` · $${g.price}` : ""}{link?.ok ? ` · ${link.retailer}` : ""}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                            {SLOT[s.id].worn && (
                              <button className="tiny-btn" aria-pressed={!!g.featured} onClick={() => toggleFeature(g.id)}
                                style={g.featured ? { background: THEME.slateMid, color: "#fff" } : undefined}>
                                {g.featured ? "Featured" : "Feature"}
                              </button>
                            )}
                            <button className="tiny-btn" onClick={() => setEditing(g)}>Edit</button>
                            <button className="tiny-btn" onClick={() => onSell(g)}><Tag size={10} /> Sell</button>
                            {n > 0 && <span className="tiny-note">Worn on {n} hike{n > 1 ? "s" : ""}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {state.gear.length === 0 && (
            <Empty icon={Package} title="Your locker is empty"
              subtitle="Add what you own — it shows on your loadout, on your entries, and it's one tap from the market." />
          )}
          <button className="outline-btn" style={{ marginTop: 8 }} onClick={() => setEditing({ slot: "other" })}>
            <Plus size={14} style={{ verticalAlign: -2 }} /> Add gear
          </button>
        </div>
      )}

      {tab === "Kits" && (
        <div style={{ padding: "16px 18px 18px" }}>
          <div style={{ color: THEME.textDim, fontSize: 12, marginBottom: 14, lineHeight: 1.45 }}>
            Group gear you always wear together — pick the kit when you log a hike instead of tapping each item.
          </div>
          {kits.length === 0 ? (
            <Empty icon={Layers} title="No kits yet"
              subtitle="Bundle your usual outfit into a kit for one-tap logging." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {kits.map((k) => {
                const items = k.gearIds.map((id) => state.gear.find((g) => g.id === id)).filter(Boolean);
                return (
                  <div key={k.id} className="rank-card" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14 }}>{k.name}</div>
                      <div style={{ color: THEME.gray, fontSize: 12 }}>{items.length} item{items.length !== 1 ? "s" : ""}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 7 }}>
                        {items.map((g) => <span key={g.id} className="gear-tag">{g.name}</span>)}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                        <button className="tiny-btn" onClick={() => setEditingKit(k)}>Edit</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button className="outline-btn" onClick={() => setEditingKit({ gearIds: [] })} disabled={state.gear.length === 0}>
            <Plus size={14} style={{ verticalAlign: -2 }} /> Create kit
          </button>
          {state.gear.length === 0 && (
            <div style={{ color: THEME.textDim, fontSize: 12, marginTop: 10, textAlign: "center", lineHeight: 1.45 }}>
              Add gear to your locker first — a kit is a group of items you already own.
            </div>
          )}
        </div>
      )}

      {editing && (
        <GearModal item={editing} onClose={() => setEditing(null)} onSave={save}
          onRemove={editing.id ? () => remove(editing.id) : null} />
      )}

      {editingKit && (
        <KitModal item={editingKit} gear={state.gear}
          onClose={() => setEditingKit(null)} onSave={onSaveKit}
          onRemove={editingKit.id ? () => onRemoveKit(editingKit.id) : null} />
      )}
    </div>
  );
}

export default GearScreen;



