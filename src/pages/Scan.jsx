import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import Quagga from "quagga";

export default function Scan() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const hasDetectedRef = useRef(false);

  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Click Start Scan");

  useEffect(() => {
    if (!scanning || !scannerRef.current) return;

    hasDetectedRef.current = false;
    setStatus("Scanning...");

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["ean_reader", "upc_reader", "code_128_reader"],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error(err);
          setStatus("Camera error ❌");
          setScanning(false);
          return;
        }
        Quagga.start();
      }
    );

    const onDetected = (data) => {
      if (hasDetectedRef.current) return;

      hasDetectedRef.current = true;
      const code = data.codeResult.code;

      setBarcode(code);
      setStatus("Scan successful ✅");
      setScanning(false);

      navigate("/add-med", { state: { barcode: code } });

      Quagga.stop();
      Quagga.offDetected(onDetected);
    };

    Quagga.onDetected(onDetected);

    return () => {
      try {
        Quagga.offDetected(onDetected);
        Quagga.stop();
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    };
  }, [scanning, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>💊 Scan Medicine</h2>

      <div
        ref={scannerRef}
        style={{
          width: "320px",
          height: "240px",
          margin: "20px auto",
          border: "2px dashed #4caf50",
          borderRadius: "10px",
          background: "#000",
        }}
      />

      <button
        onClick={() => setScanning(true)}
        disabled={scanning}
        style={{
          padding: "10px 20px",
          background: scanning ? "#999" : "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: scanning ? "not-allowed" : "pointer",
        }}
      >
        {scanning ? "Scanning..." : "Start Scan"}
      </button>

      <p style={{ marginTop: "10px" }}>{status}</p>

      <p>
        <strong>Barcode:</strong> {barcode || "---"}
      </p>
    </div>
  );
}