import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

export function QRCodePrint({ equipement }) {
  const url = `${window.location.origin}/equipements/${equipement.id}`;

  function print() {
    const win = window.open('', '_blank', 'width=400,height=500');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${equipement.nom}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; color: #111; }
            h2 { margin: 12px 0 4px; font-size: 18px; }
            p { margin: 2px 0; font-size: 13px; color: #555; }
            svg { display: block; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div id="qr"></div>
          <h2>${equipement.nom}</h2>
          <p>${equipement.fabricant || ''} ${equipement.modele || ''}</p>
          <p>${equipement.numero_serie ? 'S/N: ' + equipement.numero_serie : ''}</p>
          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
          <script>
            QRCode.toCanvas(document.createElement('canvas'), '${url}', { width: 200 }, function(err, canvas) {
              if (!err) document.getElementById('qr').appendChild(canvas);
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
      <div className="bg-white p-3 rounded-lg">
        <QRCodeSVG value={url} size={140} />
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
