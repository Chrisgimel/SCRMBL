import React, { useState, useEffect } from "react";
import { Search, MessageCircle, Bookmark, Check, Sparkles, Repeat, Tag, MapPin, Trash2, Package } from "lucide-react";
import ListingArt from "../components/ListingArt";
import Empty from "../components/ui/Empty";
import Sheet from "../components/modals/Sheet";
import Chip from "../components/ui/Chip";
import Avatar from "../components/ui/Avatar";
import { ASSETS, COPY, DIST_FILTERS, MARKET_CATS, THEME, USER_BY_HANDLE } from "../constants";
import { uid } from "../utils/helpers";

function MarketScreen({ state, setState, premium, openThread, openInbox, openUser, sellDraft, clearSellDraft, toast }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [dist, setDist] = useState("any");
  const [onlySaved, setOnlySaved] = useState(false);
  const [menu, setMenu] = useState(null);
  const [selling, setSelling] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => { if (sellDraft) setSelling(true); }, [sellDraft]);

  const distMax = DIST_FILTERS.find((d) => d.id === dist).max;
  const list = state.listings.filter((l) =>
    l.title.toLowerCase().includes(q.trim().toLowerCase())
    && (cat === "all" || l.cat === cat)
    && l.dist <= distMax
    && (!onlySaved || state.saved.includes(l.id))
  );
  const catLabel = MARKET_CATS.find((c) => c.id === cat).label;
  const distLabel = DIST_FILTERS.find((d) => d.id === dist).label;
  const unread = state.threads.filter((t) => t.messages.length > 0).length;

  const toggleSave = (id) => setState((s) => ({
    ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
  }));

  const message = (listing) => {
    const existing = state.threads.find((t) => t.listingId === listing.id);
    if (existing) { setDetail(null); return openThread(existing.id); }
    const id = uid("t");
    setState((s) => ({
      ...s,
      threads: [{ id, listingId: listing.id, handle: listing.seller, messages: [], at: Date.now() }, ...s.threads],
    }));
    setDetail(null);
    openThread(id);
  };

  const markSold = (listing) => {
    const take = +(listing.price * 0.05).toFixed(2);
    setState((s) => ({
      ...s,
      listings: s.listings.map((l) => (l.id === listing.id ? { ...l, sold: true } : l)),
      sales: [...s.sales, { id: uid("s"), listingId: listing.id, title: listing.title, gross: listing.price, fee: take, net: +(listing.price - take).toFixed(2), at: new Date().toISOString().slice(0, 10) }],
    }));
    setDetail(null);
    toast(`Marked sold · $${(listing.price - take).toFixed(2)} recorded to you`);
  };

  return (
    <div className="screen" style={{ background: THEME.canvas, position: "relative" }}>
      {ASSETS.gearArt && (
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.28,
          backgroundImage: `url(${ASSETS.gearArt})`, backgroundSize: "115% auto",
          backgroundPosition: "center 30%", backgroundRepeat: "repeat-y",
        }} />
      )}
      <div style={{ position: "relative" }}>
        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} color={THEME.gray} style={{ position: "absolute", left: 12, top: 11 }} />
            <input className="field" style={{ margin: 0, paddingLeft: 36 }} value={q}
              onChange={(e) => setQ(e.target.value)} placeholder="Search gear" aria-label="Search listings" />
          </div>
          <button className="round-btn" onClick={openInbox} aria-label={`Messages${unread ? `, ${unread} thread${unread > 1 ? "s" : ""}` : ""}`} style={{ position: "relative" }}>
            <MessageCircle size={19} color={THEME.grayLight} />
            {unread > 0 && <span className="dot">{unread}</span>}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "6px 16px 10px", alignItems: "center", position: "relative" }}>
          <button className="chip" aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}
            style={{ background: onlySaved ? THEME.slateMid : THEME.slateDeep }}>
            <Bookmark size={13} style={{ verticalAlign: -2 }} fill={onlySaved ? THEME.sky : "none"} color={onlySaved ? THEME.sky : "currentColor"} /> {state.saved.length}
          </button>
          <button className="chip" onClick={() => setMenu(menu === "cat" ? null : "cat")} aria-expanded={menu === "cat"}
            style={{ background: THEME.slateDeep, color: cat === "all" ? THEME.sky : THEME.mintLight }}>{catLabel} ▾</button>
          <button className="chip" onClick={() => setMenu(menu === "dist" ? null : "dist")} aria-expanded={menu === "dist"}
            style={{ background: THEME.grayLight, color: THEME.ink, marginLeft: "auto" }}>{distLabel} ▾</button>

          {menu && (
            <>
              <div className="menu-scrim" onClick={() => setMenu(null)} />
              <div className="menu" style={menu === "dist" ? { right: 16, left: "auto" } : { left: 16 }}>
                {(menu === "cat" ? MARKET_CATS : DIST_FILTERS).map((o) => {
                  const on = menu === "cat" ? cat === o.id : dist === o.id;
                  return (
                    <button key={o.id} className="menu-item" style={{ color: on ? THEME.mintLight : THEME.grayLight }}
                      onClick={() => { menu === "cat" ? setCat(o.id) : setDist(o.id); setMenu(null); }}>
                      {o.label}{on && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!premium && (
          <div style={{ margin: "0 16px 10px", background: THEME.slateDeep, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
            <Sparkles size={16} color={THEME.sky} />
            <div style={{ flex: 1, color: THEME.gray, fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ color: THEME.sky, fontWeight: 700 }}>Ad · </span>{COPY.adText}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: "0 2px 14px" }}>
          {list.map((l) => (
            <button key={l.id} onClick={() => setDetail(l)} style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer", textAlign: "left" }}>
              <div style={{ aspectRatio: "1", position: "relative" }}>
                <ListingArt listing={l} />
                {l.sold && <div className="sold-veil"><span>Sold</span></div>}
                {!l.sold && l.kind !== "sell" && (
                  <div className="kind-flag"><Repeat size={10} /> {l.kind === "trade" ? "Trade only" : "Trade ok"}</div>
                )}
                <div role="button" tabIndex={0} aria-label={state.saved.includes(l.id) ? `Unsave ${l.title}` : `Save ${l.title}`}
                  onClick={(e) => { e.stopPropagation(); toggleSave(l.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleSave(l.id); } }}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.45)", borderRadius: 8, padding: 5, cursor: "pointer" }}>
                  <Bookmark size={15} color={state.saved.includes(l.id) ? THEME.sky : "#fff"}
                    fill={state.saved.includes(l.id) ? THEME.sky : "none"} />
                </div>
              </div>
              <div style={{ padding: "8px 12px 14px" }}>
                <div style={{ color: THEME.grayLight, fontWeight: 800, fontSize: 16 }}>
                  {l.kind === "trade" ? "Trade" : `$${l.price}`}
                </div>
                <div style={{ color: THEME.grayLight, fontSize: 13, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{l.title}</div>
                <div style={{ color: THEME.gray, fontSize: 12 }}>{l.location} · {l.dist} mi</div>
              </div>
            </button>
          ))}
          {list.length === 0 && (
            <div style={{ gridColumn: "1/3" }}>
              <Empty icon={Tag}
                title={onlySaved ? "Nothing saved yet" : "No gear matches"}
                subtitle={onlySaved ? "Tap the bookmark on any listing and it lands here." : "Try a wider distance or a different category — or list yours."} />
            </div>
          )}
        </div>

        <div style={{ padding: "0 16px 18px" }}>
          <button className="primary-btn" onClick={() => setSelling(true)}>Sell or trade gear</button>
          <div style={{ color: THEME.gray, fontSize: 11.5, textAlign: "center", marginTop: 8 }}>{COPY.commissionNote}</div>
          {state.sales.length > 0 && (
            <div className="ledger">
              <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Your sales</div>
              {state.sales.map((s) => (
                <div key={s.id} className="ledger-row">
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                  <span style={{ color: THEME.textDim }}>−${s.fee.toFixed(2)}</span>
                  <span style={{ color: THEME.mintLight, fontWeight: 700 }}>${s.net.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ color: THEME.textDim, fontSize: 11, marginTop: 8, lineHeight: 1.45 }}>
                Recorded locally. Payouts need a payment processor — no money has moved.
              </div>
            </div>
          )}
        </div>
      </div>

      {selling && (
        <SellModal draft={sellDraft} onClose={() => { setSelling(false); clearSellDraft(); }}
          onSave={(item) => {
            setState((s) => ({ ...s, listings: [{ ...item, id: uid("l"), hue: Math.floor(Math.random() * 5), mine: true, seller: "you", sold: false }, ...s.listings] }));
            setSelling(false); clearSellDraft(); toast("Listing posted");
          }}
        />
      )}

      {detail && (
        <ListingSheet state={state} listing={detail} onClose={() => setDetail(null)} openUser={openUser}
          onMessage={() => message(detail)} onMarkSold={() => markSold(detail)}
          onDelete={() => { setState((s) => ({ ...s, listings: s.listings.filter((x) => x.id !== detail.id) })); setDetail(null); }}
        />
      )}
    </div>
  );
}

function ListingSheet({ state, listing, onClose, onMessage, onMarkSold, onDelete, openUser }) {
  const seller = USER_BY_HANDLE[listing.seller];
  const thread = state.threads.find((t) => t.listingId === listing.id);
  return (
    <Sheet title={listing.sold ? "Sold listing" : "Listing"} onClose={onClose}
      footer={listing.mine ? (
        !listing.sold && <button className="primary-btn" onClick={onMarkSold}>Mark sold · you keep ${(listing.price * 0.95).toFixed(2)}</button>
      ) : (
        <button className="primary-btn" disabled={listing.sold} onClick={onMessage}>
          <MessageCircle size={15} style={{ verticalAlign: -3 }} /> {thread ? "Open your thread" : "Message seller"}
        </button>
      )}>
      <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "16/10", marginBottom: 12, position: "relative" }}>
        <ListingArt listing={listing} />
        {listing.sold && <div className="sold-veil"><span>Sold</span></div>}
      </div>
      <div style={{ color: THEME.grayLight, fontWeight: 800, fontSize: 22 }}>
        {listing.kind === "trade" ? "Trade only" : `$${listing.price}`}
      </div>
      <div style={{ color: THEME.grayLight, fontSize: 16, fontWeight: 600 }}>{listing.title}</div>
      <div style={{ color: THEME.gray, fontSize: 13, margin: "4px 0 10px" }}>
        <MapPin size={13} style={{ verticalAlign: -2 }} /> {listing.location} · {listing.dist} mi away
      </div>
      {listing.kind !== "sell" && listing.lookingFor && (
        <div className="looking-for">
          <Repeat size={13} />
          <div><span style={{ color: THEME.textDim }}>Looking for </span>{listing.lookingFor}</div>
        </div>
      )}
      {listing.desc && <div style={{ color: THEME.creamGreen, fontSize: 14, lineHeight: 1.5, marginTop: 10 }}>{listing.desc}</div>}

      {seller && (
        <div className="row-card" style={{ marginTop: 14, cursor: "default" }}>
          <button onClick={() => openUser(seller.handle)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label={`${seller.name}'s profile`}>
            <Avatar hue={seller.hue} size={38} handle={seller.handle} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button onClick={() => openUser(seller.handle)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%", color: THEME.grayLight, fontWeight: 600, fontSize: 13.5, font: "inherit" }} aria-label={`${seller.name}'s profile`}>
              {seller.name}
            </button>
            <div style={{ color: THEME.gray, fontSize: 12 }}>{seller.city}</div>
          </div>
        </div>
      )}

      {listing.mine && (
        <button className="outline-btn" style={{ marginTop: 14 }} onClick={onDelete}>
          <Trash2 size={14} style={{ verticalAlign: -2 }} /> Remove my listing
        </button>
      )}
    </Sheet>
  );
}

function SellModal({ draft, onClose, onSave }) {
  const [title, setTitle] = useState(draft ? `${draft.brand} ${draft.name}`.trim() : "");
  const [kind, setKind] = useState("sell");
  const [price, setPrice] = useState(draft?.price ? Math.round(draft.price * 0.5) : "");
  const [lookingFor, setLookingFor] = useState("");
  const [location, setLocation] = useState("");
  const [cat, setCat] = useState(() => {
    if (!draft) return "other";
    const map = { pack: "pack", shelter: "shelter", sleep: "sleep", stove: "stove", traction: "traction" };
    return map[draft.slot] || "other";
  });
  const [desc, setDesc] = useState("");
  const [photos, setPhotos] = useState([]);
  const p = Number(price) || 0;
  const needsPrice = kind !== "trade";
  const ok = title.trim() && (!needsPrice || p > 0) && (kind === "sell" || lookingFor.trim());

  return (
    <Sheet title="Sell or trade" onClose={onClose} dirty={!!(title.trim() || desc.trim())}
      footer={
        <button className="primary-btn" disabled={!ok}
          onClick={() => onSave({
            title: title.trim(), kind, price: needsPrice ? p : 0,
            lookingFor: kind === "sell" ? "" : lookingFor.trim(),
            location: location.trim() || "Nearby", dist: Math.floor(Math.random() * 30) + 2,
            cat, desc: desc.trim(), photo: photos[0] || null,
          })}>
          Post listing
        </button>
      }>
      {draft && (
        <div className="prior-note" style={{ marginBottom: 14 }}>
          <Package size={13} />
          <span>Filled in from your locker. Half of what you paid is a starting guess, not a valuation.</span>
        </div>
      )}
      <label className="field-label">Sell, trade, or both?</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Chip on={kind === "sell"} onClick={() => setKind("sell")}>Sell</Chip>
        <Chip on={kind === "trade"} onClick={() => setKind("trade")}>Trade only</Chip>
        <Chip on={kind === "both"} onClick={() => setKind("both")}>Either</Chip>
      </div>

      <label className="field-label" htmlFor="s-title">What are you listing?</label>
      <input id="s-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2P backpacking tent" />

      {needsPrice && (
        <>
          <label className="field-label" htmlFor="s-price">Price (USD)</label>
          <input id="s-price" className="field" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
        </>
      )}
      {kind !== "sell" && (
        <>
          <label className="field-label" htmlFor="s-lf">What you'd take in trade</label>
          <input id="s-lf" className="field" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="e.g. Microspikes, or a 40L pack" />
        </>
      )}

      <label className="field-label">Category</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {MARKET_CATS.filter((c) => c.id !== "all").map((c) => (
          <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>
        ))}
      </div>

      <label className="field-label">Photo</label>
      {/* PhotoPicker component would go here */}
    </Sheet>
  );
}

export default MarketScreen;





