const express = require("express");
const cors = require("cors");
const wppconnect = require("@wppconnect-team/wppconnect");

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));

const PORT = process.env.WPP_PORT || 3000;
let client = null;
let qrCodeBase64 = null;
let isReady = false;

console.log("🔄 Iniciando WhatsApp WPPConnect (Nexora)...");
wppconnect
  .create({
    session: "nexora",
    headless: true,
    devtools: false,
    useChrome: true,
    autoClose: 0,
    waitForLogin: true,
    logQR: false,
    browserArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
    puppeteerOptions: { headless: true },
    catchQR: (base64Qrimg) => {
      qrCodeBase64 = base64Qrimg;
      console.log("\n📱 QR actualizado");
    },
    statusFind: (statusSession) => {
      console.log("📌 Estado:", statusSession);
    },
  })
  .then((cli) => {
    client = cli;
    isReady = true;
    console.log("\n✅ WHATSAPP CONECTADO");
  })
  .catch((err) => {
    console.error("❌ Error iniciando WhatsApp:", err);
  });

// Estado del servicio
app.get("/status", (req, res) => {
  res.json({ connected: isReady, qrAvailable: !!qrCodeBase64 });
});

// Página con el QR para vincular el WhatsApp
app.get("/qr", (req, res) => {
  if (!qrCodeBase64) return res.send("✅ WhatsApp ya conectado");
  const qrSrc = qrCodeBase64.startsWith("data:") ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`;
  res.send(`<html><body style="text-align:center;font-family:Arial;padding-top:30px;">
    <h2>📱 Escanea el QR con WhatsApp</h2><img src="${qrSrc}" width="350" /></body></html>`);
});

// Enviar mensaje (texto o imagen base64)
app.post("/send-message", async (req, res) => {
  try {
    if (!client || !isReady) {
      return res.status(503).json({ success: false, error: "WhatsApp no conectado" });
    }
    const { phone, message, image } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: "phone y message son requeridos" });
    }
    const number = phone.replace(/\D/g, "") + "@c.us";
    try {
      if (image && image.startsWith("data:image")) {
        await client.sendFileFromBase64(number, image, "adjunto.jpg", message);
      } else {
        await client.sendText(number, message);
      }
    } catch (sendErr) {
      if (!sendErr?.message?.includes("msgChunks")) throw sendErr;
    }
    console.log(`✅ Enviado a ${phone}`);
    return res.json({ success: true, phone });
  } catch (error) {
    console.error("❌ Error enviando:", error);
    return res.status(500).json({ success: false, error: error?.message ?? "Error desconocido" });
  }
});

app.listen(PORT, () => {
  console.log(`\n=========================\n🚀 WhatsApp server en puerto ${PORT}\nQR: http://localhost:${PORT}/qr\n=========================`);
});
