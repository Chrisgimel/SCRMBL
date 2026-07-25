
import { ChevronLeft, MessageCircle } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import Empty from "../components/ui/Empty";
import ListingArt from "../components/ListingArt";
import { THEME, USER_BY_HANDLE } from "../constants";


function InboxScreen({ state, onBack, openThread }) {
  const threads = [...state.threads].sort((a, b) => b.at - a.at);
  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "18px 18px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="round-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={20} color={THEME.grayLight} /></button>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: THEME.grayLight }}>Messages</div>
      </div>
      <div style={{ padding: "8px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {threads.length === 0 && (
          <Empty icon={MessageCircle} title="No threads yet"
            subtitle="Message a seller from any listing and the conversation lives here." />
        )}
        {threads.map((t) => {
          const l = state.listings.find((x) => x.id === t.listingId);
          const u = USER_BY_HANDLE[t.handle];
          const last = t.messages[t.messages.length - 1];
          return (
            <button key={t.id} className="row-card" onClick={() => openThread(t.id)}>
              <Avatar hue={u?.hue ?? 0} size={42} handle={t.handle} />
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <div style={{ color: THEME.grayLight, fontWeight: 600, fontSize: 14 }}>{u?.name || t.handle}</div>
                <div style={{ color: THEME.gray, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {last ? last.text : `About: ${l?.title || "a listing"}`}
                </div>
              </div>
              {l && <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><ListingArt listing={l} /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default InboxScreen;



