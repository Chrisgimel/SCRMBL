import React, { useState } from "react";
import { Plus, Tag, Package, Layers } from "lucide-react";
import UnderlineTabs from "../components/ui/UnderlineTabs";
import Empty from "../components/ui/Empty";
import { ASSETS, COPY, GEAR_SLOTS, SLOT, THEME, WORN_SLOTS } from "../constants";
import { readProductLink } from "../utils/retailers";
import GearModal from "../components/gear/GearModal";
import KitModal from "../components/gear/KitModal";

function GearScreen({ state, onSell, toast, saveGear, removeGear, toggleFeature, saveKit, removeKit }) {
  const [tab, setTab] = useState("Loadout");
  const [editing, setEditing] = useState(null);
  const [editingKit, setEditingKit] = useState(null);
  const featured = state.gear.filter((g) => g.featured && SLOT[g.slot]?.worn);
  const total = state.gear.reduce((a, g) => a + (Number(g.price) || 0), 0);
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
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 2px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, maxWidth: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {ASSETS.mannequin ? (
                  <img src={ASSETS.mannequin} alt="" style={{ height: 210, maxWidth: "100%", filter: featured.length ? "none" : "brightness(0.85)" }} />
                ) : (
                  <svg viewBox="0 0 120 190" width="150" aria-hidden="true">
                    <ellipse cx="60" cy="176" rx="42" ry="12" fill="rgba(0,0,0,0.25)" />
                    <g fill={featured.length ? THEME.sageDeep : "#1c1c1e"}>
                      <ellipse cx="60" cy="22" rx="13" ry="16" />
                      <path d="M44 46 Q60 40 76 46 L74 96 Q60 102 46 96 Z" />
                      <rect x="47" y="98" width="11" height="60" rx="5" />
                      <rect x="62" y="98" width="11" height="60" rx="5" />
                    </g>
                  </svg>
                )}
                <div style={{ width: 130, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.28)", marginTop: -10 }} />
              </div>
              {featured.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                  {featured.map((g) => (
                    <span key={g.id} className="gear-tag" style={{ maxWidth: 108, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {SLOT[g.slot].label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ margin: "6px 24px", background: THEME.sageDeep, borderRadius: 18, padding: "14px 18px", textAlign: "center", color: THEME.grayLight }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "10px 22px 20px" }}>
            {WORN_SLOTS.map((s) => {
              const items = state.gear.filter((g) => g.slot === s.id);
              const shown = items.find((g) => g.featured) || items[0];
              return (
                <button key={s.id} onClick={() => setEditing(shown || { slot: s.id })}
                  className="gear-slot" style={{ background: shown ? THEME.slateDeep : THEME.sageDeep }}>
                  {shown ? (
                    <>
                      <div style={{ fontSize: 10, color: THEME.mintLight, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.grayLight, lineHeight: 1.2, textAlign: "center" }}>{shown.name}</div>
                      <div style={{ fontSize: 10.5, color: THEME.gray }}>{shown.brand}{items.length > 1 ? ` +${items.length - 1}` : ""}</div>
                    </>
                  ) : (
                    <>
                      <Plus size={24} color={THEME.grayLight} strokeWidth={3} />
                      <div style={{ fontSize: 10.5, color: THEME.grayLight, opacity: 0.75 }}>{s.label}</div>
                    </>
                  )}
                </button>
              );
            })}
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



