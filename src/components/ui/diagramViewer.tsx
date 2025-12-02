"use client";

import { useEffect, useRef } from "react";

interface DiagramViewerProps {
  xml: string;
  height?: number;
}

export default function DiagramViewer({ xml, height = 400 }: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Limpia si no hay XML
    if (!xml || xml.trim().length === 0) {
      root.innerHTML = "";
      return;
    }

    // Limpia cualquier contenido anterior
    root.innerHTML = "";

    // 1. Crear el div.mxgraph
    const drawioDiv = document.createElement("div");
    drawioDiv.classList.add("mxgraph");
    drawioDiv.style.maxWidth = "100%";
    drawioDiv.style.height = "100%";
    drawioDiv.style.border = "1px solid transparent";

    const mxGraphData = {
      editable: false,
      highlight: "#0000ff",
      nav: true,
      resize: true,
      toolbar: "zoom",
      xml,
    };

    // draw.io espera un JSON en data-mxgraph
    drawioDiv.setAttribute("data-mxgraph", JSON.stringify(mxGraphData));

    // 2. Script del viewer justo después (patrón oficial)
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://viewer.diagrams.net/js/viewer.min.js";

    // 3. Añadir ambos al contenedor
    root.appendChild(drawioDiv);
    root.appendChild(script);

    // No necesitamos limpiar nada especial: en el próximo render
    // root.innerHTML = "" borra el div y el script.

  }, [xml]);

  if (!xml || xml.trim().length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height }}
      className="rounded-lg bg-white"
    />
  );
}
