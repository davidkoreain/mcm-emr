import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface CSVImportModalProps {
  title: string;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ title, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const simulateImport = () => {
    if (!file) return;
    setStatus('parsing');
    setTimeout(() => {
      setStatus('success');
      // In a real app, we would parse CSV and pass it to onImport
    }, 1500);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="modal-content" style={{ background: 'white', width: '500px', borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ background: 'var(--primary-color)', padding: '1.25rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> Bulk Import: {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {status === 'idle' ? (
            <>
              <div 
                style={{ border: '2px dashed #cbd5e1', padding: '3rem 2rem', borderRadius: '1rem', cursor: 'pointer', marginBottom: '1.5rem' }}
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <Upload size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
                <p style={{ fontWeight: '600' }}>{file ? file.name : 'Click to select *.csv file'}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Max file size: 5MB</p>
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              <button 
                onClick={() => {}} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto 1.5rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                <Download size={14} /> Download Sample Template
              </button>
              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '0.75rem' }} 
                disabled={!file}
                onClick={simulateImport}
              >
                Upload and Process
              </button>
            </>
          ) : status === 'parsing' ? (
            <div style={{ padding: '2rem' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
              <p style={{ fontWeight: '600' }}>Parsing CSV data...</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Checking for duplicates and validation errors.</p>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div style={{ color: '#10b981', marginBottom: '1rem' }}><CheckCircle size={64} style={{ margin: '0 auto' }} /></div>
              <h3 style={{ marginBottom: '0.5rem' }}>Import Successful!</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>142 records have been added to the database.</p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>Finish</button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CSVImportModal;
