import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Send } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import Empty from "../components/ui/Empty";
import ListingArt from "../components/ListingArt";
import { THEME, USER_BY_HANDLE } from "../constants";
import { uid } from "../utils/helpers";

function ThreadScreen({ state, setState, threadId, onBack, openUser }) {
  const t = state.threads.find((x) => x.id === threadId);
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [t?.messages.length]);
  if (!t) return <Empty title="Thread not found" />;
  const l = state.listings.find((x) => x.id === t.listingId);
  const u = USER_BY_HANDLE[t.handle];

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    setState((s) => ({
      ...s,
      threads: s.threads.map((x) => (x.id === threadId
        ? { ...x, at: Date.now(), messages: [...x.messages, { id: uid("m"), from: "you", text: body, at: Date.now() }] }
        : x)),
    }));
  };

  return (
    <div className="screen" style={{ background: THEME.canvas, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 18px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${THEME.hairline}` }}>
        <button className="round-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={20} color={THEME.grayLight} /></button>
        <Avatar hue={u?.hue ?? 0} size={34} handle={t.handle} ring={false} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <button onClick={() => openUser(t.handle)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%", color: THEME.grayLight, fontWeight: 700, fontSize: 15, font: "inherit" }} aria-label={`${u?.name || t.handle}'s profile`}>
            {u?.name || t.handle}
          </button>
          <div style={{ color: THEME.textDim, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l?.title}</div>
        </div>
        {l && <div style={{ width: 38, height: 38, borderRadius: 8, overflow: "hidden" }}><ListingArt listing={l} /></div>}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        {l && (
          <div className="thread-head">
            <div style={{ color: THEME.grayLight, fontWeight: 700 }}>{l.kind === "trade" ? "Trade only" : `$${l.price}`} · {l.title}</div>
            {l.kind !== "sell" && l.lookingFor && <div style={{ color: THEME.textDim, marginTop: 3 }}>Wants: {l.lookingFor}</div>}
          </div>
        )}
        {t.messages.length === 0 && (
          <div style={{ color: THEME.textDim, fontSize: 12.5, textAlign: "center", padding: "18px 20px", lineHeight: 1.5 }}>
            Say what you're after — condition, meeting spot, or what you'd trade.
          </div>
        )}
        {t.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.from === "you" ? "mine" : "theirs"}`}>{m.text}</div>
        ))}
        {t.messages.length > 0 && (
          <div style={{ color: THEME.textDim, fontSize: 11, textAlign: "center", padding: "8px 24px", lineHeight: 1.5 }}>
            Sent. Threads are stored on this device — delivery to other hikers arrives with real accounts.
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "10px 14px 16px", display: "flex", gap: 8, alignItems: "center", borderTop: `1px solid ${THEME.hairline}` }}>
        <input className="field" style={{ margin: 0 }} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message" aria-label="Write a message" />
        <button className="round-btn" onClick={send} disabled={!text.trim()} aria-label="Send message"
          style={{ background: text.trim() ? THEME.slateMid : THEME.surfaceHi }}>
          <Send size={17} color={THEME.grayLight} />
        </button>
      </div>
    </div>
  );
}

export default ThreadScreen;



