import dynamic from "next/dynamic";

const MapPanel = dynamic(() => import("./MapPanelClient"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[420px] bg-slate-700 rounded-xl flex items-center justify-center text-slate-400">
      Loading map...
    </div>
  ),
});

export default MapPanel;
