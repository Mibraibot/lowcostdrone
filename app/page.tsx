"use client";

import { useState } from "react";
import DashboardStats from "@/components/sections/DashboardStats";
import DashboardNavbar from "@/components/sections/DashboardNavbar";
import OverviewPanel from "@/components/sections/panels/OverviewPanel";
import AlertsPanel from "@/components/sections/panels/AlertsPanel";
import SettingsPanel from "@/components/sections/panels/SettingsPanel";
import "leaflet/dist/leaflet.css";


export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-6">
      <DashboardStats />

      <DashboardNavbar active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <OverviewPanel />}
      {activeTab === "alerts" && <AlertsPanel />}
      {activeTab === "settings" && <SettingsPanel />}
    </div>
  );
}
