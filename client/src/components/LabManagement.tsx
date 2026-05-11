import React, { useState, useMemo } from 'react';
import { Beaker, Clipboard } from 'lucide-react';
import { toast } from '../utils/toast';
import ListFilterControl from './ListFilterControl';

const LabManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'results'>('orders');

  const [ordSearch, setOrdSearch] = useState('');
  const [ordFilters, setOrdFilters] = useState<Record<string, string>>({ priority: '' });
  const [ordSort, setOrdSort] = useState('time_desc');

  const [resSearch, setResSearch] = useState('');
  const [resFilters, setResFilters] = useState<Record<string, string>>({ status: '' });
  const [resSort, setResSort] = useState('name_asc');

  const labOrders = [
    { id: 1, patient: 'Abebe Bikila', amharic: 'አበበ ቢቂላ', tests: ['CBC', 'Blood Sugar'], priority: 'Normal', time: '15 mins ago', sortIdx: 3 },
    { id: 2, patient: 'Mulu Worku', amharic: 'ሙሉ ወርቁ', tests: ['Malaria Parasite', 'Widal'], priority: 'Urgent', time: '5 mins ago', sortIdx: 1 },
    { id: 3, patient: 'Kassa Tessema', amharic: 'ካሳ ተሰማ', tests: ['LFT', 'RFT'], priority: 'Normal', time: '30 mins ago', sortIdx: 4 },
    { id: 4, patient: 'Selam Adane', amharic: 'ሰላም አዳነ', tests: ['Urine R/E'], priority: 'Urgent', time: '2 mins ago', sortIdx: 0 },
    { id: 5, patient: 'Biruk Alemu', amharic: 'ብሩክ አለሙ', tests: ['Typhoid', 'ESR'], priority: 'Normal', time: '45 mins ago', sortIdx: 5 },
  ];

  const recentResults = [
    { id: 101, patient: 'Kassa Tessema', test: 'Hemoglobin', value: '9.2', unit: 'g/dL', range: '12.0 – 16.0', status: 'Abnormal' },
    { id: 102, patient: 'Selam Adane', test: 'FBG', value: '95', unit: 'mg/dL', range: '70 – 100', status: 'Normal' },
    { id: 103, patient: 'Abebe Bikila', test: 'WBC', value: '11.5', unit: 'x10³/µL', range: '4.5 – 11.0', status: 'Abnormal' },
    { id: 104, patient: 'Tigist Hailu', test: 'Creatinine', value: '0.9', unit: 'mg/dL', range: '0.6 – 1.2', status: 'Normal' },
  ];

  const filteredOrders = useMemo(() => {
    let result = labOrders.filter((o) => {
      const q = ordSearch.toLowerCase();
      if (q && !o.patient.toLowerCase().includes(q) && !o.tests.some((t) => t.toLowerCase().includes(q))) return false;
      if (ordFilters.priority && o.priority !== ordFilters.priority) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      ordSort === 'time_asc' ? b.sortIdx - a.sortIdx : a.sortIdx - b.sortIdx
    );
  }, [ordSearch, ordFilters, ordSort]);

  const filteredResults = useMemo(() => {
    let result = recentResults.filter((r) => {
      const q = resSearch.toLowerCase();
      if (q && !r.patient.toLowerCase().includes(q) && !r.test.toLowerCase().includes(q)) return false;
      if (resFilters.status && r.status !== resFilters.status) return false;
      return true;
    });
    return [...result].sort((a, b) =>
      resSort === 'name_desc'
        ? b.patient.localeCompare(a.patient)
        : a.patient.localeCompare(b.patient)
    );
  }, [resSearch, resFilters, resSort]);

  return (
    <div className="lab-container">
      <div className="pharmacy-tabs">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Clipboard size={20} /> Pending Lab Orders
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <Beaker size={20} /> Lab Results
        </button>
      </div>

      <div className="pharmacy-content">
        {activeTab === 'orders' ? (
          <>
            <ListFilterControl
              searchValue={ordSearch}
              onSearchChange={setOrdSearch}
              searchPlaceholder="Search by patient name or test..."
              filters={[
                {
                  key: 'priority', label: 'Priority',
                  options: [
                    { label: 'All', value: '' },
                    { label: 'Urgent', value: 'Urgent' },
                    { label: 'Normal', value: 'Normal' },
                  ],
                },
              ]}
              filterValues={ordFilters}
              onFilterChange={(k, v) => setOrdFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={ordSort}
              sortOptions={[
                { label: 'Newest First', value: 'time_desc' },
                { label: 'Oldest First', value: 'time_asc' },
              ]}
              onSortChange={setOrdSort}
              totalCount={labOrders.length}
              filteredCount={filteredOrders.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Tests Requested</th>
                    <th>Priority</th>
                    <th>Order Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div><strong>{order.patient}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.amharic}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {order.tests.map((test) => (
                            <span key={test} className="status-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{test}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${order.priority === 'Urgent' ? 'status-pending' : 'status-active'}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td>{order.time}</td>
                      <td>
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toast('Lab result entry form opening...', 'info')}>
                          Enter Results
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No lab orders match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <ListFilterControl
              searchValue={resSearch}
              onSearchChange={setResSearch}
              searchPlaceholder="Search by patient name or test..."
              filters={[
                {
                  key: 'status', label: 'Result',
                  options: [
                    { label: 'All', value: '' },
                    { label: 'Normal', value: 'Normal' },
                    { label: 'Abnormal', value: 'Abnormal' },
                  ],
                },
              ]}
              filterValues={resFilters}
              onFilterChange={(k, v) => setResFilters((prev) => ({ ...prev, [k]: v }))}
              sortValue={resSort}
              sortOptions={[
                { label: 'Name A→Z', value: 'name_asc' },
                { label: 'Name Z→A', value: 'name_desc' },
              ]}
              onSortChange={setResSort}
              totalCount={recentResults.length}
              filteredCount={filteredResults.length}
            />
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Result</th>
                    <th>Normal Range</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr key={res.id}>
                      <td>{res.patient}</td>
                      <td><strong>{res.test}</strong></td>
                      <td style={{ color: res.status === 'Abnormal' ? '#ef4444' : 'inherit', fontWeight: '700' }}>
                        {res.value} {res.unit}
                      </td>
                      <td>{res.range}</td>
                      <td>
                        <span
                          className={`status-badge ${res.status === 'Normal' ? 'status-active' : 'status-pending'}`}
                          style={{
                            background: res.status === 'Normal' ? '#dcfce7' : '#fee2e2',
                            color: res.status === 'Normal' ? '#166534' : '#991b1b',
                          }}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toast('Lab report loading...', 'info')}>
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No results match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LabManagement;
