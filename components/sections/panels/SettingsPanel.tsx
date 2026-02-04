export default function SettingsPanel() {
  return (
    <div className="mt-6 bg-[#151b2d] rounded-xl p-6">
      <h3 className="mb-4 text-slate-300">Settings</h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Enable Notifications</span>
          <input type="checkbox" className="scale-125" />
        </div>

        <div className="flex justify-between items-center">
          <span>Auto Refresh</span>
          <input type="checkbox" className="scale-125" />
        </div>
      </div>
    </div>
  );
}
