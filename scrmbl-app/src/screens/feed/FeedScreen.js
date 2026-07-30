import React, { useState } from "react";
import UnderlineTabs from "../../components/ui/UnderlineTabs";
import Wordmark from "../../components/ui/Wordmark";
import { THEME } from "../../constants";
import FriendsTab from "./FriendsTab";
import DiscoverTab from "./DiscoverTab";

function FeedScreen({ state, setState, openHike, openUser, toggleLike, isLiked, getLikeCount, openReviewDetail, openPhotoViewer }) {
  const [tab, setTab] = useState("Discover");
  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ marginBottom: 14 }}><Wordmark size={26} color={THEME.grayLight} /></div>
        <UnderlineTabs tabs={["Discover", "Friends"]} active={tab} onChange={setTab} />
      </div>
      {tab === "Friends" && <FriendsTab state={state} setState={setState} openHike={openHike} openUser={openUser} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openReviewDetail={openReviewDetail} openPhotoViewer={openPhotoViewer} />}
      {tab === "Discover" && <DiscoverTab state={state} openHike={openHike} openUser={openUser} />}
    </div>
  );
}

export default FeedScreen;
