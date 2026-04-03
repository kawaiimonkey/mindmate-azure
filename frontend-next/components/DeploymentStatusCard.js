"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/mindmate";

export default function DeploymentStatusCard() {
  const [state, setState] = useState({
    loading: true,
    ok: false,
    message: "",
    service: "",
    checkedAt: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/status`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const data = await response.json();
        if (cancelled) return;

        setState({
          loading: false,
          ok: Boolean(data?.ok),
          message: data?.message || "Status unavailable",
          service: data?.service || "",
          checkedAt: data?.checkedAt || "",
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          loading: false,
          ok: false,
          message: error.message || "Unable to reach backend",
          service: "",
          checkedAt: "",
        });
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`deployment-card ${state.ok ? "success" : "error"}`}>
      <div className="deployment-label">Live Deployment Check</div>
      <div className="deployment-message">
        {state.loading ? "Checking backend status..." : state.message}
      </div>
      {!state.loading && (
        <div className="deployment-meta">
          {state.service ? `Source: ${state.service}` : "Source: unavailable"}
          {state.checkedAt ? ` | ${new Date(state.checkedAt).toLocaleString()}` : ""}
        </div>
      )}
    </div>
  );
}
