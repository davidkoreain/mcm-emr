import React, { useState } from 'react';
import { 
  Scissors, 
  Calendar, 
  Users, 
  Wrench, 
  Pill, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Plus, 
  Layout,
  Search,
  Filter
} from 'lucide-react';

const OperationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'resources' | 'supplies'>('schedule');

  const otSchedules = [
    { id: 1, room: 'OT 1 (Major)', patient: 'Abebe Bikila', surgery: 'Appendectomy', time: '08:00 - 10:00', surgeon: 'Dr. Solomon', status: 'Ongoing' },
    { id: 2, room: 'OT 2 (Ortho)', patient: 'Mulu Worku', surgery: 'Hip Replacement', time: '10:30 - 13:00', surgeon: 'Dr. Abraham', status: 'Scheduled' },
    { id: 3, room: 'OT 3 (Minor)', patient: 'Selam Adane', surgery: 'Cyst Removal', time: '09:00 - 10:00', surgeon: 'Dr. Fitsum', status: 'Completed' },
  ];

  const currentResources = {
    staff: [
      { name: 'Dr. Solomon Tsegaye', role: 'Main Surgeon', dept: 'Surgery' },
      { name: 'Dr. Fitsum Ayele', role: 'Anesthesiologist', dept: 'Anesthesia' },
      { name: 'Nurse Martha Kassa', role: 'Scrub Nurse', dept: 'Nursing' }
    ],
    equipment: [
      { name: 'Laparoscopic Tower', id: 'AST-045', status: 'In Use (OT 1)' },
      { name: 'C-Arm X-Ray', id: 'AST-088', status: 'Available' }
    ]
  };

  const supplyUsage = [
    { item: 'Propofol 20ml', qty: 2, unit: 'Vial', source: 'Pharmacy DB' },
    { item: 'Surgical Gloves (Size 7.5)', qty: 10, unit: 'Pair', source: 'Inventory DB' },
    { item: 'Vicryl 3-0 Suture', qty: 4, unit: 'Pack', source: 'Inventory DB' }
  ];

  return (
    <div className="surgery-container">
      <div className="pharmacy-tabs">
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={20} />
          OT Schedule
        </button>
        <button 
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <Users size={20} />
          Staff & Equipment
        </button>
        <button 
          className={`tab-btn ${activeTab === 'supplies' ? 'active' : ''}`}
          onClick={() => setActiveTab('supplies')}
        >
          <Pill size={20} />
          Supply Tracking
        </button>
      </div>

      <div className="surgery-content" style={{ marginTop: '1.5rem' }}>
        {activeTab === 'schedule' ? (
          <div className="schedule-view">
             <div className="content-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search surgery or patient..." />
                  </div>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} />
                    Filter Rooms
                  </button>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  Book Surgery
                </button>
             </div>

             <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>OT Room</th>
                      <th>Time Slot</th>
                      <th>Patient</th>
                      <th>Surgery Type</th>
                      <th>Main Surgeon</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otSchedules.map(sc => (
                      <tr key={sc.id}>
                        <td><strong>{sc.room}</strong></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> {sc.time}</div></td>
                        <td>{sc.patient}</td>
                        <td>{sc.surgery}</td>
                        <td>{sc.surgeon}</td>
                        <td>
                          <span className={`status-badge ${sc.status === 'Ongoing' ? 'status-pending' : (sc.status === 'Completed' ? 'status-active' : 'status-pending')}`} style={{ 
                            background: sc.status === 'Ongoing' ? '#fef3c7' : (sc.status === 'Completed' ? '#dcfce7' : '#f1f5f9'),
                            color: sc.status === 'Ongoing' ? '#92400e' : (sc.status === 'Completed' ? '#166534' : '#64748b')
                          }}>
                            {sc.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        ) : activeTab === 'resources' ? (
          <div className="resource-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div className="stat-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                   <Users size={20} color="var(--secondary-color)" />
                   Surgical Team (Current OT 1)
                </h3>
                <div className="staff-list">
                   {currentResources.staff.map((s, idx) => (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                        <div>
                           <div style={{ fontWeight: '600' }}>{s.name}</div>
                           <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.dept}</div>
                        </div>
                        <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{s.role}</span>
                     </div>
                   ))}
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>Assign More Staff</button>
             </div>

             <div className="stat-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                   <Wrench size={20} color="var(--secondary-color)" />
                   Allocated Equipment
                </h3>
                <div className="equip-list">
                   {currentResources.equipment.map((e, idx) => (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                        <div>
                           <div style={{ fontWeight: '600' }}>{e.name}</div>
                           <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {e.id}</div>
                        </div>
                        <span className={`status-badge ${e.status.includes('Available') ? 'status-active' : 'status-pending'}`}>
                          {e.status}
                        </span>
                     </div>
                   ))}
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>Request Equipment (Asset DB)</button>
             </div>
          </div>
        ) : (
          <div className="supply-section">
             <div className="stat-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                   <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={20} color="#ef4444" />
                      Supplies & Medications Consumed
                   </h3>
                   <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '700' }}>Linked to Inventory DB</span>
                </div>
                <div className="data-table-container">
                   <table className="data-table">
                     <thead>
                       <tr>
                         <th>Item Name</th>
                         <th>Quantity</th>
                         <th>Unit</th>
                         <th>Database Link</th>
                         <th>Action</th>
                       </tr>
                     </thead>
                     <tbody>
                       {supplyUsage.map((u, idx) => (
                         <tr key={idx}>
                           <td><strong>{u.item}</strong></td>
                           <td>{u.qty}</td>
                           <td>{u.unit}</td>
                           <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.source}</span></td>
                           <td><button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                   <button className="btn-secondary">Add Item</button>
                   <button className="btn-primary">Finalize Usage & Deduct Inventory</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationManagement;
