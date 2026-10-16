import { SHARE_SIZE, renderShareImage } from "../_og/shareImage";
import { GUIDE_CARD, GUIDE_CARD_ALT } from "../_og/cards";

// Card design 2026-10-16. Next.js hashes this file, not shareImage.tsx, into the image URL, and LinkedIn
// and X cache images by URL: change this date whenever the card design changes so they fetch the new one.

export const alt = GUIDE_CARD_ALT;
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareImage(GUIDE_CARD);
}
