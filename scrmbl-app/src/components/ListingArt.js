
import { Tag } from "lucide-react";
import { ASSETS } from "../constants";
import { POSTER_PALETTES } from "../utils/helpers";

function ListingArt({ listing, style }) {
  const url = listing.photo || ASSETS.listingImages[listing.id];
  if (url) return <img src={url} alt="" style={{ objectFit: "cover", width: "100%", height: "100%", display: "block", ...style }} />;
  const pal = POSTER_PALETTES[listing.hue % POSTER_PALETTES.length];
  return (
    <div style={{ width: "100%", height: "100%", background: pal[1], display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <Tag size={30} color={pal[2]} strokeWidth={1.5} />
    </div>
  );
}

export default ListingArt;


