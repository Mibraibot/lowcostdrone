import Card from "@/components/ui/Card";
import "./globals.css";

export default function Home() {
  return (
    <div className="p-6 flex gap-4 flex-wrap">
      <Card title="Overview" value={120} />
      <Card title="Alerts" value={5} />
      <Card title="Settings" value={3} />
      <Card title="Teritorial Status" value={3} />
    </div>
  );
}
