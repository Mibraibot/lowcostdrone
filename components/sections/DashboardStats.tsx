import Card from "@/components/ui/Card";

export default function DashboardStats() {
  return (
    <div className="flex gap-4 flex-wrap">
      <Card title="Overview" value={120} />
      <Card title="Alerts" value={5} />
      <Card title="Settings" value={3} />
      <Card title="Teritorial Status" value={3} />
    </div>
  );
}
