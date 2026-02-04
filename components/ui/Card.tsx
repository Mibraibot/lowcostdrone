interface CardProps {
  title: string;
  value: string | number;
}

export default function Card({ title, value }: CardProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-md w-40">
      <h3 className="text-slate-400 text-sm">{title}</h3>
      <p className="text-white text-xl font-semibold">{value}</p>
    </div>
  );
}
