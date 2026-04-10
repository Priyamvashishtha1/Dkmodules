import { AdminPanelNav } from "@/components/admin-panel-nav";
import { listCustomers } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div className="stack">
      <AdminPanelNav />
      <section className="card">
        <h1>Customer Database</h1>
        <p>Every registered customer, city, mobile number, and remaining points.</p>
      </section>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>City</th>
              <th>Total Points</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id.toString()}>
                <td>{customer.name}</td>
                <td>{customer.mobile}</td>
                <td>{customer.city}</td>
                <td>{customer.wallet.totalPoints}</td>
                <td>{customer.wallet.remainingPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
