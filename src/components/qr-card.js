import QRCode from "qrcode";

function getRewardsUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  return `${baseUrl.replace(/\/$/, "")}/rewards`;
}

export async function QrCard() {
  const rewardsUrl = getRewardsUrl();
  const qrDataUrl = await QRCode.toDataURL(rewardsUrl, {
    width: 280,
    margin: 1,
    color: {
      dark: "#7d2d0d",
      light: "#fffaf1"
    }
  });

  return (
    <div className="qr-card">
      <div className="qr-frame">
        <img src={qrDataUrl} alt="QR code for DK Enterprises rewards registration" />
      </div>
      <div className="qr-copy">
        <p className="eyebrow">Counter QR</p>
        <h2>Scan to join rewards</h2>
        <p>
          Customers can scan this code at the billing desk to open the rewards form
          instantly.
        </p>
        <code>{rewardsUrl}</code>
      </div>
    </div>
  );
}
