interface Props {
  active: string;
  onChange: (tab: string) => void;
}

const tabs = ["overview", "alerts", "settings"];

export default function DashboardNavbar({ active, onChange }: Props) {
  return (
    <div className="mt-6 flex gap-6 border-b border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-3 capitalize transition-colors
            ${
              active === tab
                ? "text-white border-b-2 border-blue-500"
                : "text-slate-400 hover:text-white"
            }`}
        >
          {tab === "alerts" ? "Alerts Detail" : tab}
        </button>
      ))}
    </div>
  );
}
