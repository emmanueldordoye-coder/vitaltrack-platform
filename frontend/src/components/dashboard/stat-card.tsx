interface StatCardProps {
  label: string;
  value: number;
  description?: string;
  tone?: "default" | "attention" | "success";
}

const toneStyles = {
  default: "border-slate-200 text-lighthouse-primary",
  attention: "border-red-200 text-red-700",
  success: "border-emerald-200 text-lighthouse-accent",
};

export const StatCard = ({
  label,
  value,
  description,
  tone = "default",
}: StatCardProps) => (
  <div
    className={`rounded-lg border bg-white p-5 shadow-sm ${toneStyles[tone]}`}
  >
    <p className="text-sm font-semibold text-slate-600">{label}</p>
    <p className="mt-3 text-4xl font-bold tracking-normal">{value}</p>
    {description ? (
      <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p>
    ) : null}
  </div>
);
