import QRCode from "qrcode";

function getRewardsUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  return `${baseUrl.replace(/\/$/, "")}/rewards`;
}

export default async function PrintQrPage() {
  const rewardsUrl = getRewardsUrl();
  const qrDataUrl = await QRCode.toDataURL(rewardsUrl, {
    width: 420,
    margin: 1,
    color: {
      dark: "#7d2d0d",
      light: "#fffaf1"
    }
  });

  return (
    <div className="print-page">
      <section className="print-poster">
        <p className="eyebrow">DK Enterprises Rewards</p>
        <h1>Scan & Get Reward Points</h1>
        <p className="print-lead">
          Register your purchase, earn points instantly, and redeem them on your next visit.
        </p>

        <div className="print-qr-frame">
          <img src={qrDataUrl} alt="Printable QR code for rewards registration" />
        </div>

        <div className="print-benefits">
          <p>Rs 100 spent = 1 reward point</p>
          <p>1 point = Rs 1 redemption value</p>
          <p>WhatsApp rewards updates after billing</p>
        </div>

        <code>{rewardsUrl}</code>
      </section>
    </div>
  );
}
