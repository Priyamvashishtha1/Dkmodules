import { AdminPanelNav } from "@/components/admin-panel-nav";
import { formatCurrency } from "@/lib/format";
import { getDashboardStats } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total Customers", value: stats.customerCount },
    { label: "Total Purchases", value: stats.purchaseCount },
    { label: "Reward Points Issued", value: stats.totalPoints },
    { label: "Repeat Customers", value: stats.repeatCustomers },
    { label: "Redeemed Points", value: stats.redeemedPoints },
    { label: "Monthly Sales Snapshot", value: formatCurrency(stats.totalSales) }
  ];

  return (
    <div className="stack">
      <AdminPanelNav />
      <section className="card">
        <p className="eyebrow">Admin Overview</p>
        <h1>CRM Dashboard</h1>
        <p>Monitor customer growth, purchase volume, rewards issued, and repeat business.</p>
      </section>

      <section className="grid three-up">
        {cards.map((card) => (
          <article key={card.label} className="card stat-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
