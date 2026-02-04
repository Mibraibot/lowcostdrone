import MapPanel from "@/components/sections/panels/MapPanel";

export default function OverviewPanel() {
  return (
    <div className="mt-6 grid grid-cols-3 gap-6">

      {/* MAP */}
      <div className="col-span-2 bg-[#151b2d] rounded-xl p-4 h-[700px]">
        <h3 className="mb-3 text-slate-300">Fleet Locations</h3>

        {/* wrapper WAJIB */}
        <div className="h-[600px]">
          <MapPanel />
        </div>
      </div>

      {/* ALERTS */}
      <div className="bg-[#151b2d] rounded-xl p-4 h-[480px]">
        <h3 className="mb-3 text-slate-300">Real-time Alerts</h3>

        <ul className="space-y-3 text-sm overflow-y-auto max-h-[420px]">
          <li className="p-3 bg-slate-800 rounded">
            🔴 Motor Failure Detected
          </li>
          <li className="p-3 bg-slate-800 rounded">
            🟡 System Update Completed
          </li>
        </ul>
      </div>

    </div>
  );
}
