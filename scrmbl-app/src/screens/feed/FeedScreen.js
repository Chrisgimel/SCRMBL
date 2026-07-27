import React, { useState } from "react";
import UnderlineTabs from "../../components/ui/UnderlineTabs";
import { THEME, COPY } from "../../constants";
import FriendsTab from "./FriendsTab";
import DiscoverTab from "./DiscoverTab";

function FeedScreen({ state, setState, openHike, openUser, toggleLike, isLiked, getLikeCount, openReviewDetail, openPhotoViewer }) {
  const [tab, setTab] = useState("Discover");
  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: THEME.grayLight, letterSpacing: 0.5, marginBottom: 14 }}>{COPY.appName}</div>
        <UnderlineTabs tabs={["Discover", "Friends"]} active={tab} onChange={setTab} />
      </div>
      {tab === "Friends" && <FriendsTab state={state} setState={setState} openHike={openHike} openUser={openUser} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openReviewDetail={openReviewDetail} openPhotoViewer={openPhotoViewer} />}
      {tab === "Discover" && <DiscoverTab state={state} openHike={openHike} openUser={openUser} />}
    </div>
  );
}

export default FeedScreen;
