import { useEffect, useRef, useState } from "react";

const TOTAL_DRINKS = 5;
const COOLDOWN_MS = 1200; // QR tekrar okunmadan önce bekleme süresi
let lastScanTime = 0;

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [drinks, setDrinks] = useState(0);
  const [message, setMessage] = useState("");

  // Beklediğimiz QR kod metni
  const qrContent = "snuggest-drink-qr";

  useEffect(() => {
    startCamera();
  }, []);

  // ==== Kamerayı Başlat ====
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      videoRef.current.srcObject = stream;
      videoRef.current.play();

      scanLoop();
    } catch (e) {
      console.error("Camera error:", e);
      setMessage("Camera access blocked or unavailable.");
    }
  };

  // ==== QR TARAYICI LOOP ====
  const scanLoop = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");

    const render = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth / 2;
        canvas.height = video.videoHeight / 2;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        import("jsqr").then((jsQR) => {
          const code = jsQR.default(imgData.data, canvas.width, canvas.height);

          if (code) {
            handleScan(code.data);
          }
        });
      }

      requestAnimationFrame(render);
    };

    render();
  };

  // ==== TARANAN QR'I İŞLE ====
  const handleScan = (text) => {
    const now = Date.now();

    // Cooldown kontrolü
    if (now - lastScanTime < COOLDOWN_MS) return;
    lastScanTime = now;

    if (!text) return;

    const cleaned = text.trim().toLowerCase();
    console.log("QR:", cleaned);

    const valid =
      cleaned.includes("snuggest") &&
      cleaned.includes("drink") &&
      cleaned.includes("qr");

    if (!valid) {
      setMessage("Invalid QR code.");
      return;
    }

    setDrinks((prev) => {
      if (prev >= TOTAL_DRINKS) return prev;

      const newCount = prev + 1;

      if (newCount === TOTAL_DRINKS) {
        setMessage("🎉 FREE DRINK UNLOCKED! 🎉");
      } else {
        setMessage(`Drink added! (${newCount}/${TOTAL_DRINKS})`);
      }

      return newCount;
    });
  };

  const resetCard = () => {
    setDrinks(0);
    setMessage("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1b2a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
        The Snuggest Loyalty Program
      </h1>

      <p style={{ color: "#ccc", marginBottom: "20px", fontSize: "18px" }}>
        Scan the QR code. Collect 5 drinks and get 1 FREE!
      </p>

      {/* STAMPS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 60px)",
          gap: "10px",
          background: "#1b263b",
          padding: "20px",
          borderRadius: "16px",
        }}
      >
        {Array.from({ length: TOTAL_DRINKS }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              border: "4px solid",
              borderColor: i < drinks ? "#2ECC71" : "#555",
              background: i < drinks ? "#2ECC71" : "transparent",
              color: i < drinks ? "white" : "#aaa",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: "20px",
            }}
          >
            {i < drinks ? "✓" : i + 1}
          </div>
        ))}
      </div>

      {/* QR CODE (Your PNG) */}
      <div
        style={{
          marginTop: "20px",
          background: "white",
          padding: "10px",
          borderRadius: "12px",
        }}
      >
        <img
          src="/snuggest-qr.png"
          alt="Snuggest QR"
          style={{ width: "150px", height: "150px" }}
        />
      </div>

      {/* CAMERA */}
      <video
        ref={videoRef}
        style={{
          width: "280px",
          marginTop: "20px",
          borderRadius: "12px",
          background: "#000",
        }}
      ></video>

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      <button
        onClick={resetCard}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: "#E74C3C",
          border: "none",
          color: "white",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Reset Card
      </button>

      {message && (
        <p style={{ marginTop: "20px", color: "#2ECC71", fontSize: "20px" }}>
          {message}
        </p>
      )}

      <footer style={{ marginTop: "40px", color: "#aaa" }}>
        The Snuggest Gastro & Pub · Zirgu iela 3, Riga
      </footer>
    </div>
  );
}
