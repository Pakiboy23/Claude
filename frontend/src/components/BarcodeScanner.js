import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'barcode-scanner-region',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [
          0, // QR_CODE
          11, // CODE_128
          12, // CODE_39
          13, // EAN_13
          14, // EAN_8
          15, // UPC_A
          16  // UPC_E
        ]
      },
      false
    );

    scanner.render(
      (decodedText) => {
        console.log('Scanned:', decodedText);
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        // Ignore errors during scanning
        if (error && !error.includes('NotFoundException')) {
          console.error('Scan error:', error);
        }
      }
    );

    return () => {
      scanner.clear().catch(err => console.error('Error clearing scanner:', err));
    };
  }, [onScan]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <h3>Scan Barcode</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="scanner-body">
          <div id="barcode-scanner-region"></div>

          {error && (
            <div className="scanner-error">
              <p>{error}</p>
            </div>
          )}

          <div className="scanner-instructions">
            <p>📱 Position the barcode within the frame</p>
            <p>💡 Make sure there's good lighting</p>
            <p>🎯 Hold steady for best results</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
