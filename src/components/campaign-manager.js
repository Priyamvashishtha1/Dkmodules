"use client";

import { useState } from "react";

export function CampaignManager() {
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: ""
  });
  const [campaignMessage, setCampaignMessage] = useState("");
  const [status, setStatus] = useState("");

  async function createOffer(event) {
    event.preventDefault();
    setStatus("Creating offer...");

    const response = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offerForm)
    });

    const data = await response.json();
    setStatus(data.message || (response.ok ? "Offer created." : "Could not create offer."));
  }

  async function sendCampaign(event) {
    event.preventDefault();
    setStatus("Sending WhatsApp campaign...");

    const response = await fetch("/api/whatsapp/send-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: campaignMessage })
    });

    const data = await response.json();
    setStatus(
      response.ok
        ? `Campaign processed for ${data.total} customers.`
        : data.error || "Could not send campaign."
    );
  }

  return (
    <div className="split-grid">
      <section className="card">
        <h2>Create Offer</h2>
        <form className="form-grid" onSubmit={createOffer}>
          <input
            placeholder="Offer title"
            value={offerForm.title}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <textarea
            placeholder="Offer description"
            value={offerForm.description}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, description: event.target.value }))
            }
            required
          />
          <input
            type="date"
            value={offerForm.startDate}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, startDate: event.target.value }))
            }
            required
          />
          <input
            type="date"
            value={offerForm.endDate}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, endDate: event.target.value }))}
            required
          />
          <button type="submit">Save Offer</button>
        </form>
      </section>

      <section className="card">
        <h2>Broadcast Campaign</h2>
        <form className="form-grid" onSubmit={sendCampaign}>
          <textarea
            placeholder="Write your WhatsApp campaign..."
            value={campaignMessage}
            onChange={(event) => setCampaignMessage(event.target.value)}
            required
          />
          <button type="submit">Send to Customers</button>
        </form>
      </section>

      {status ? <p className="status">{status}</p> : null}
    </div>
  );
}
