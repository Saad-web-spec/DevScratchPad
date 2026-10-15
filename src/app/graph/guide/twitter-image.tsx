import { SHARE_SIZE, renderShareImage } from "../_og/shareImage";
import { GUIDE_CARD, GUIDE_CARD_ALT } from "../_og/cards";

export const alt = GUIDE_CARD_ALT;
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareImage(GUIDE_CARD);
}
