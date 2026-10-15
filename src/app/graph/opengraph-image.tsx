import { SHARE_SIZE, renderShareImage } from "./_og/shareImage";
import { GRAPH_CARD, GRAPH_CARD_ALT } from "./_og/cards";

export const alt = GRAPH_CARD_ALT;
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareImage(GRAPH_CARD);
}
