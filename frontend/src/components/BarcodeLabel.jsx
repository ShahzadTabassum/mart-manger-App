import { useEffect, useRef } from "react";

// Renders a single barcode SVG using inline SVG + CODE128
// No external library needed — pure calculation
export default function BarcodeLabel({ sku, name, price, showPrice = true }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || !sku) return;
    drawBarcode(svgRef.current, sku);
  }, [sku]);

  return (
    <div style={s.label}>
      <div style={s.productName}>{name}</div>
      <svg ref={svgRef} style={s.svg} />
      <div style={s.skuText}>{sku}</div>
      {showPrice && price && <div style={s.price}>SGD {parseFloat(price).toFixed(2)}</div>}
    </div>
  );
}

// ── Code128B encoder (subset B — alphanumeric) ──
function drawBarcode(svg, text) {
  const CODE128_B = [
    " ","!",'"',"#","$","%","&","'","(",")","*","+",",","-",".","/",
    "0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
    "@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
    "P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
    "`","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
    "p","q","r","s","t","u","v","w","x","y","z","{","|","}","~","DEL"
  ];

  // Code128 bar patterns (11 modules each)
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

  // Build codes array
  const codes = [START_B];
  let checksum = START_B;
  for (let i = 0; i < text.length; i++) {
    const idx = CODE128_B.indexOf(text[i]);
    if (idx === -1) continue; // skip unsupported chars
    codes.push(idx);
    checksum += (i + 1) * idx;
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  // Build bar string
  let bars = "";
  for (const code of codes) {
    bars += PATTERNS[code] || "";
  }
  bars += "11"; // termination bar

  // Draw SVG
  const barW    = 2;
  const barH    = 50;
  const totalW  = bars.length * barW;
  const totalH  = barH;

  svg.setAttribute("width", totalW);
  svg.setAttribute("height", totalH);
  svg.setAttribute("viewBox", `0 0 ${totalW} ${totalH}`);
  svg.innerHTML = "";

  let x = 0;
  for (const bit of bars) {
    if (bit === "1") {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", 0);
      rect.setAttribute("width", barW);
      rect.setAttribute("height", barH);
      rect.setAttribute("fill", "#000");
      svg.appendChild(rect);
    }
    x += barW;
  }
}

const s = {
  label:       { display:"inline-flex", flexDirection:"column", alignItems:"center", padding:"10px 14px", border:"1px solid #e5e7eb", borderRadius:6, background:"#fff", gap:4, fontFamily:"monospace" },
  productName: { fontSize:11, fontWeight:700, color:"#111827", textAlign:"center", maxWidth:160, wordBreak:"break-word", lineHeight:1.3 },
  svg:         { display:"block" },
  skuText:     { fontSize:10, color:"#374151", letterSpacing:".05em" },
  price:       { fontSize:12, fontWeight:700, color:"#4f46e5" },
};
