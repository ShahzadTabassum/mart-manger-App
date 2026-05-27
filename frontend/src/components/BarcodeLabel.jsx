import { useEffect, useRef } from "react";

// Size configs in mm → px at 96dpi (1mm = 3.7795px)
const SIZES = {
  small:  { w: 50, h: 30, barH: 28, barW: 1.4, fontSize: 6,  nameSize: 7,  priceSize: 7  },
  medium: { w: 100, h: 50, barH: 55, barW: 2.2, fontSize: 9,  nameSize: 11, priceSize: 10 },
};

const MM = 3.7795;

export default function BarcodeLabel({ sku, name, price, showPrice = true, size = "small" }) {
  const svgRef = useRef();
  const cfg    = SIZES[size] || SIZES.small;

  useEffect(() => {
    if (!svgRef.current || !sku) return;
    drawBarcode(svgRef.current, sku, cfg.barH, cfg.barW);
  }, [sku, size]);

  const wPx = cfg.w * MM;
  const hPx = cfg.h * MM;

  return (
    <div style={{
      display:       "inline-flex",
      flexDirection: "column",
      alignItems:    "center",
      justifyContent:"center",
      width:         `${wPx}px`,
      height:        `${hPx}px`,
      border:        "0.5px solid #ccc",
      background:    "#fff",
      padding:       "2px 4px",
      boxSizing:     "border-box",
      gap:           1,
      fontFamily:    "monospace",
      overflow:      "hidden",
    }}>
      {/* Product name */}
      <div style={{
        fontSize:    cfg.nameSize,
        fontWeight:  700,
        color:       "#111",
        textAlign:   "center",
        width:       "100%",
        overflow:    "hidden",
        whiteSpace:  "nowrap",
        textOverflow:"ellipsis",
        lineHeight:  1.2,
      }}>
        {name}
      </div>

      {/* Barcode SVG */}
      <svg ref={svgRef} style={{ display:"block", maxWidth:"100%" }} />

      {/* SKU text */}
      <div style={{ fontSize: cfg.fontSize, color:"#333", letterSpacing:".04em" }}>
        {sku}
      </div>

      {/* Price */}
      {showPrice && price && (
        <div style={{ fontSize: cfg.priceSize, fontWeight:700, color:"#4f46e5" }}>
          SGD {parseFloat(price).toFixed(2)}
        </div>
      )}
    </div>
  );
}

// ── Code128B encoder ──
function drawBarcode(svg, text, barH, barW) {
  const CODE128_B = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~DEL'.split('');

  const PATTERNS = [
    "11011001100","11001101100","11001100110","10010011000","10010001100",
    "10001001100","10011001000","10011000100","10001100100","11001001000",
    "11001000100","11000100100","10110011100","10011011100","10011001110",
    "10111001100","10011101100","10011100110","11001110010","11001011100",
    "11001001110","11011100100","11001110100","11101101110","11101001100",
    "11100101100","11100100110","11101100100","11100110100","11100110010",
    "11011011000","11011000110","11000110110","10100011000","10001011000",
    "10001000110","10110001000","10001101000","10001100010","11010001000",
    "11000101000","11000100010","10110111000","10110001110","10001101110",
    "10111011000","10111000110","10001110110","11101110110","11010001110",
    "11000101110","11011101000","11011100010","11011101110","11101011000",
    "11101000110","11100010110","11101101000","11101100010","11100011010",
    "11101111010","11001000010","11110001010","10100110000","10100001100",
    "10010110000","10010000110","10000101100","10000100110","10110010000",
    "10110000100","10011010000","10011000010","10000110100","10000110010",
    "11000010010","11001010000","11110111010","11000010100","10001111010",
    "10100111100","10010111100","10010011110","10111100100","10011110100",
    "10011110010","11110100100","11110010100","11110010010","11011011110",
    "11011110110","11110110110","10101111000","10100011110","10001011110",
    "10111101000","10111100010","11110101000","11110100010","10111011110",
    "10111101110","11101011110","11110101110","11010000100","11010010000",
    "11010011100","11000111010",
  ];

  const START_B = 104;
  const STOP    = 106;

  const codes = [START_B];
  let checksum = START_B;
  const chars = text.split("");
  for (let i = 0; i < chars.length; i++) {
    const idx = CODE128_B.indexOf(chars[i]);
    if (idx < 0) continue;
    codes.push(idx);
    checksum += (i + 1) * idx;
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  let bars = "";
  for (const code of codes) bars += (PATTERNS[code] || "");
  bars += "11";

  const totalW = bars.length * barW;

  svg.setAttribute("width",   totalW);
  svg.setAttribute("height",  barH);
  svg.setAttribute("viewBox", `0 0 ${totalW} ${barH}`);
  svg.innerHTML = "";

  let x = 0;
  for (const bit of bars) {
    if (bit === "1") {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x",      x);
      rect.setAttribute("y",      0);
      rect.setAttribute("width",  barW);
      rect.setAttribute("height", barH);
      rect.setAttribute("fill",   "#000");
      svg.appendChild(rect);
    }
    x += barW;
  }
}
