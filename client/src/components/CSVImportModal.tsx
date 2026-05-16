import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface CSVImportModalProps {
  title: string;
  onClose: () => void;
  onImport: (data: Record<string, string>[]) => void | Promise<{ imported: number; errors: string[] }>;
  templateHeaders?: string[];
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields
    const values: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }

  return rows;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ title, onClose, onImport, templateHeaders }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus('parsing');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error('No data rows found in CSV');
      const res = await onImport(rows);
      const result = res ?? { imported: rows.length, errors: [] };
      setResult(result);
      setStatus(result.errors.length > 0 && result.imported === 0 ? 'error' : 'success');
    } catch (err: any) {
      setResult({ imported: 0, errors: [err.message] });
      setStatus('error');
    }
  };

  const downloadTemplate = () => {
    if (!templateHeaders) return;
    const csv = templateHeaders.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', width: '520px', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ background: '#0f172a', padding: '1.25rem 1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FileText size={18} /> Bulk Import: {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '2rem' }}>
          {status === 'idle' && (
            <>
              <div
                style={{ border: '2px dashed #cbd5e1', padding: '2.5rem 2rem', borderRadius: '1rem', cursor: 'pointer', marginBottom: '1.25rem', textAlign: 'center', background: file ? '#f0fdf4' : '#f8fafc', borderColor: file ? '#86efac' : '#cbd5e1' }}
                onClick={() => document.getElementById('csv-upload-input')?.click()}
              >
                <Upload size={40} color={file ? '#16a34a' : '#94a3b8'} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                <p style={{ fontWeight: '700', color: file ? '#16a34a' : '#374151', marginBottom: '0.25rem' }}>
                  {file ? file.name : 'Click to select *.csv file'}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Max file size: 5MB</p>
                <input id="csv-upload-input" type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              {templateHeaders && (
                <button
                  onClick={downloadTemplate}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', cursor: 'pointer', padding: 0 }}
                >
                  <Download size={14} /> Download column template (empty CSV)
                </button>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
                disabled={!file}
                onClick={handleImport}
              >
                Upload and Import
              </button>
            </>
          )}

          {status === 'parsing' && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.25rem' }} />
              <p style={{ fontWeight: '700', color: '#1e293b' }}>Importing data...</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Parsing and inserting records into database.</p>
            </div>
          )}

          {(status === 'success' || status === 'error') && result && (
            <div style={{ textAlign: 'center' }}>
              {status === 'success' ? (
                <CheckCircle size={56} color="#16a34a" style={{ margin: '0 auto 1rem', display: 'block' }} />
              ) : (
                <AlertCircle size={56} color="#ef4444" style={{ margin: '0 auto 1rem', display: 'block' }} />
              )}
              <h3 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
                {status === 'success' ? 'Import Complete' : 'Import Failed'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: result.errors.length > 0 ? '1rem' : '1.5rem' }}>
                {result.imported} record{result.imported !== 1 ? 's' : ''} imported successfully.
              </p>
              {result.errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', maxHeight: '160px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#dc2626', marginBottom: '0.5rem' }}>{result.errors.length} error(s):</p>
                  {result.errors.map((e, i) => (
                    <p key={i} style={{ fontSize: '0.78rem', color: '#991b1b', margin: '2px 0' }}>• {e}</p>
                  ))}
                </div>
              )}
              <button className="btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CSVImportModal;
