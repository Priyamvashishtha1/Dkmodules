import { AdminPanelNav } from "@/components/admin-panel-nav";
import { formatCurrency, formatDate } from "@/lib/format";
import { listPurchases } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminPurchasesPage() {
  const purchases = await listPurchases();

  return (
    <div className="stack">
      <AdminPanelNav />
      <section className="card">
        <h1>Purchase History</h1>
        <p>Track invoices, models sold, and points earned on each transaction.</p>
      </section>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Model</th>
              <th>Amount</th>
              <th>Points</th>
              <th>Invoice</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase._id.toString()}>
                <td>{purchase.customerId?.name || "Unknown"}</td>
                <td>{purchase.mobileModel}</td>
                <td>{formatCurrency(purchase.price)}</td>
                <td>{purchase.pointsEarned}</td>
                <td>{purchase.invoiceNumber}</td>
                <td>{formatDate(purchase.purchaseDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
