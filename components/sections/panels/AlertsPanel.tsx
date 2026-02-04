export default function AlertsPanel() {
  return (
    <div className="mt-6 bg-[#151b2d] rounded-xl p-6">
      <h3 className="mb-4 text-slate-300">Alerts Detail</h3>

      <table className="w-full text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="text-left py-2">Time</th>
            <th className="text-left py-2">Type</th>
            <th className="text-left py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-700">
            <td className="py-3">10:32</td>
            <td>Motor Failure</td>
            <td className="text-red-400">Critical</td>
          </tr>
          <tr className="border-t border-slate-700">
            <td className="py-3">11:10</td>
            <td>System Update</td>
            <td className="text-yellow-400">Warning</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
