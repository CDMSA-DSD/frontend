"use client";

import { useEffect, useRef } from "react";

interface DiagramViewerProps {
  xml: string;
  /** Si no se especifica height, el contenedor se ajusta al tamaño del diagrama (hasta maxHeight). */
  height?: number;
  maxHeight?: number;
}

export default function DiagramViewer({
  xml,
  height,
  maxHeight = 600,
}: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    if (!xml || xml.trim().length === 0) {
      root.innerHTML = "";
      return;
    }

    root.innerHTML = "";

    const drawioDiv = document.createElement("div");
    drawioDiv.classList.add("mxgraph");
    drawioDiv.style.maxWidth = "100%";
    // 👇 ya NO forzamos height aquí. El SVG decidirá la altura natural.
    // drawioDiv.style.height = "100%";
    drawioDiv.style.border = "1px solid transparent";

    const mxGraphData = {
      editable: false,
      highlight: "#0000ff",
      nav: true,
      resize: true,
      toolbar: "zoom",
      xml,
    };

    drawioDiv.setAttribute("data-mxgraph", JSON.stringify(mxGraphData));

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://viewer.diagrams.net/js/viewer.min.js";

    root.appendChild(drawioDiv);
    root.appendChild(script);
  }, [xml]);

  if (!xml || xml.trim().length === 0) {
    return null;
  }

  // Si height está definido → comportamiento fijo como hasta ahora
  // Si no → altura "auto" pero con un maxHeight y scroll si se pasa
  const style: React.CSSProperties = {
    width: "100%",
    overflow: "auto",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "8px",
    backgroundColor: "white",
  };

  if (height !== undefined) {
    style.height = height;
  } else {
    style.maxHeight = maxHeight;
  }

  return <div ref={containerRef} style={style} />;
}
