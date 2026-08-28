import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090B",
          borderRadius: "6px",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "white",
            letterSpacing: "-1px",
          }}
        >
          DS
        </span>
      </div>
    ),
    { ...size }
  );
}
