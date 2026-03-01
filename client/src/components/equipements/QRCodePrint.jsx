import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

const LABEL = 'IntenCites15';

export function QRCodePrint({ equipement }) {
  const url = `${window.location.origin}/equipements/${equipement.id}`;

  function print() {
    const win = window.open('', '_blank', 'width=400,height=520');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${equipement.nom}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; color: #111; }
            h2 { margin: 12px 0 4px; font-size: 18px; }
            p { margin: 2px 0; font-size: 13px; color: #555; }
            #qr { position: relative; display: inline-block; }
            #qr canvas { display: block; }
            #qrlabel {
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              border: 2px solid #111;
              padding: 3px 5px;
              font-size: 7px;
              font-weight: bold;
              color: #111;
              white-space: nowrap;
              line-height: 1;
            }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div id="qr"><div id="qrlabel">${LABEL}</div></div>
          <h2>${equipement.nom}</h2>
          <p>${equipement.fabricant || ''} ${equipement.modele || ''}</p>
          <p>${equipement.numero_serie ? 'S/N: ' + equipement.numero_serie : ''}</p>
          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
          <script>
            QRCode.toCanvas(document.createElement('canvas'), '${url}', { width: 200, errorCorrectionLevel: 'H' }, function(err, canvas) {
              if (!err) {
                var container = document.getElementById('qr');
                container.insertBefore(canvas, container.firstChild);
              }
              window.onload = function() { window.print(); };
            });
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
      <div className="relative bg-white p-3 rounded-lg">
        <QRCodeSVG value={url} size={140} level="H" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ background: 'white', border: '2px solid #111', padding: '2px 5px', lineHeight: 1 }}>
            <span style={{ fontSize: '6px', fontWeight: 'bold', color: '#111', whiteSpace: 'nowrap' }}>{LABEL}</span>
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-200">{equipement.nom}</div>
        {equipement.numero_serie && <div className="text-xs text-gray-500">S/N: {equipement.numero_serie}</div>}
      </div>
      <button
        onClick={print}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Printer size={14} /> Imprimer
      </button>
    </div>
  );
}
