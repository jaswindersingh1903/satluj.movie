"use client";

import { useEffect } from "react";

const SCRIPT_ID = "bmc-widget-script";

const CONFIG: Record<string, string> = {
  "data-name": "BMC-Widget",
  "data-cfasync": "false",
  "data-id": "jaswindersingh",
  "data-description": "Support me on Buy me a coffee!",
  "data-message":
    "If this story matters to you, please consider donating to help keep this project online and support future initiatives.",
  "data-color": "#FF813F",
  "data-position": "Right",
  "data-x_margin": "18",
  "data-y_margin": "18",
};

export function BuyMeCoffee() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    script.async = true;
    for (const [k, v] of Object.entries(CONFIG)) {
      script.setAttribute(k, v);
    }
    document.body.appendChild(script);
  }, []);

  return null;
}
