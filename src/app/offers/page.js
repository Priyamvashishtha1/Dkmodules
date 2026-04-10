import { listOffers } from "@/lib/services";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const offers = await listOffers();

  return (
    <div className="stack">
      <section className="card">
        <p className="eyebrow">Store Promotions</p>
        <h1>Latest Offers</h1>
        <p>Publish special campaigns here and mirror them into WhatsApp broadcasts.</p>
      </section>

      <section className="grid two-up">
        {offers.length ? (
          offers.map((offer) => (
            <article key={offer._id.toString()} className="card">
              <p className="badge">{offer.status}</p>
              <h2>{offer.title}</h2>
              <p>{offer.description}</p>
              <p className="muted">
                {formatDate(offer.startDate)} to {formatDate(offer.endDate)}
              </p>
            </article>
          ))
        ) : (
          <article className="card">
            <h2>No offers yet</h2>
            <p>Create your first campaign from the admin panel to show it here.</p>
          </article>
        )}
      </section>
    </div>
  );
}
