import { AdminPanelNav } from "@/components/admin-panel-nav";
import { CampaignManager } from "@/components/campaign-manager";
import { listOffers } from "@/lib/services";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const offers = await listOffers();

  return (
    <div className="stack">
      <AdminPanelNav />
      <section className="card">
        <h1>Offers & WhatsApp Campaigns</h1>
        <p>Create promotions and broadcast them to your customers from one screen.</p>
      </section>

      <CampaignManager />

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Offer</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer._id.toString()}>
                <td>{offer.title}</td>
                <td>{offer.status}</td>
                <td>{formatDate(offer.startDate)}</td>
                <td>{formatDate(offer.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
