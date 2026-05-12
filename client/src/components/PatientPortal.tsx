import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Heart, Activity, FileText, Beaker, LogOut, 
  ChevronLeft, ChevronRight, Clock, User, Award, GraduationCap, Filter, Search, ShieldAlert, Scissors
} from 'lucide-react';
import { useEMR, type StaffMember } from '../context/EMRContext';
import Avatar from './Avatar';

interface PortalProps {
  onLogout: () => void;
  isGuardianView?: boolean;
}

const PatientPortal: React.FC<PortalProps> = ({ onLogout, isGuardianView = false }) => {
  const { currentUser, appointments, staff, addAppointment, labResults, surgeries, guardians } = useEMR();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'records'>('dashboard');
  
  // Booking State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selDoc, setSelDoc] = useState<StaffMember | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);

  // Filter State
  const [fSpec, setFSpec] = useState('');
  const [fGender, setFGender] = useState('');
  const [fAge, setFAge] = useState('');

  if (!currentUser) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const myGuardian = guardians.find(g => g.patientMrn === currentUser.mrn);
  const privacy = myGuardian?.privacySettings || { showNotes: true, showLabs: true, showSurgeries: true };
  const canSeeNotes = isGuardianView || privacy.showNotes;
  const filteredLabs = labResults.filter(r => r.patientMrn === currentUser.mrn).filter(() => isGuardianView || privacy.showLabs);

  const specs = useMemo(() => Array.from(new Set(staff.filter(s => s.role.includes('Doctor')).map(s => s.specialization))), [staff]);
  const doctors = useMemo(() => {
    return staff.filter(s => {
      if (!s.role.includes('Doctor')) return false;
      if (fSpec && s.specialization !== fSpec) return false;
      if (fGender && s.gender !== fGender) return false;
      if (fAge) {
        if (fAge === '20-35' && (s.age < 20 || s.age > 35)) return false;
        if (fAge === '36-50' && (s.age < 36 || s.age > 50)) return false;
        if (fAge === '51+' && s.age < 51) return false;
      }
      return true;
    });
  }, [staff, fSpec, fGender, fAge]);

  const days = useMemo(() => {
    const arr = [];
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) arr.push(null);
    for (let i = 1; i <= last; i++) arr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    return arr;
  }, [currentMonth]);

  const slots = useMemo(() => {
    const s = [];
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 15) s.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    return s;
  }, []);

  const handleBooking = async () => {
    if (!selDate || !selDoc || !selTime) return;
    const [h, m] = selTime.split(':');
    const start = new Date(selDate);
    start.setHours(parseInt(h), parseInt(m), 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 15);

    try {
      await addAppointment({
        patientMrn: currentUser.mrn, doctorId: selDoc.id,
        startTime: start.toISOString(), endTime: end.toISOString(),
        status: 'Scheduled', notes: isGuardianView ? 'Guardian' : 'Patient'
      });
      alert(`Booked with Dr. ${selDoc.name}`);
      setBookingStep(1); setActiveTab('dashboard');
    } catch (e) { alert('Failed to book.'); }
  };

  const TabBtn = ({ id, label }: { id: any, label: string }) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
      background: activeTab === id ? '#2563eb' : 'transparent', color: activeTab === id ? 'white' : '#64748b', fontWeight: '700'
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar name={currentUser.name} size={40} />
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>{currentUser.name}</h1>
            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>MRN: {currentUser.mrn} {isGuardianView && '(Guardian)'}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Logout</button>
      </header>

      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '1rem', width: 'fit-content', marginBottom: '2rem' }}>
          <TabBtn id="dashboard" label="Dashboard" />
          <TabBtn id="calendar" label="Appointments" />
          <TabBtn id="records" label="Medical Records" />
        </div>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}><Activity color="#ef4444" size={20}/> Vitals Summary</h3>
              {currentUser.vitals[0] ? (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{currentUser.vitals[0].bpSystolic}/{currentUser.vitals[0].bpDiastolic}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Blood Pressure (Checked: {new Date(currentUser.vitals[0].recordedAt).toLocaleDateString()})</p>
                </div>
              ) : <p style={{ color: '#94a3b8' }}>No vitals found.</p>}
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}><Heart color="#db2777" size={20}/> Next Appointment</h3>
              {appointments.filter(a => a.patientMrn === currentUser.mrn && new Date(a.startTime) > new Date()).slice(0,1).map(a => (
                <div key={a.id} style={{ marginTop: '1rem' }}>
                  <p style={{ fontWeight: '800', margin: 0 }}>{new Date(a.startTime).toLocaleString()}</p>
                  <p style={{ fontSize: '0.9rem', color: '#64748b' }}>With Dr. {staff.find(s => s.id === a.doctorId)?.name}</p>
                </div>
              ))[0] || <p style={{ color: '#94a3b8' }}>No upcoming visits.</p>}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{bookingStep === 1 ? 'Choose Date' : bookingStep === 2 ? 'Select Doctor' : 'Confirm Time'}</h2>
              {bookingStep > 1 && <button onClick={() => setBookingStep((bookingStep - 1) as 1 | 2 | 3)} style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Back</button>}
            </div>

            {bookingStep === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', padding: '0.5rem' }}>{d}</div>)}
                {days.map((d, i) => d ? (
                  <button key={i} onClick={() => { setSelDate(d); setBookingStep(2); }} style={{
                    aspectRatio: '1', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                    background: '#f8fafc', color: '#1e293b', fontWeight: '800'
                  }}>{d.getDate()}</button>
                ) : <div key={i} />)}
              </div>
            )}

            {bookingStep === 2 && (
              <div>
                <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '1rem', display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <select onChange={e => setFSpec(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                    <option value="">All Specialties</option>
                    {specs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select onChange={e => setFGender(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                    <option value="">All Genders</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {doctors.map(doc => (
                    <div key={doc.id} style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Avatar name={doc.name} size={44} />
                        <div>
                          <div style={{ fontWeight: '800' }}>Dr. {doc.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '700' }}>{doc.specialization}</div>
                        </div>
                      </div>
                      <button onClick={() => { setSelDoc(doc); setBookingStep(3); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}>Select</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                  {slots.map(t => (
                    <button key={t} onClick={() => setSelTime(t)} style={{
                      padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
                      background: selTime === t ? '#2563eb' : 'white', color: selTime === t ? 'white' : '#1e293b',
                      fontWeight: '800', cursor: 'pointer'
                    }}>{t}</button>
                  ))}
                </div>
                <button onClick={handleBooking} disabled={!selTime} style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '1rem', background: selTime ? '#2563eb' : '#cbd5e1', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer' }}>Confirm Appointment</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'records' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}><FileText color="#2563eb" size={20}/> Consultation Notes</h3>
              {canSeeNotes ? <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>{currentUser.diagnosisSummary || 'No recent notes.'}</div> : <PrivacyBar />}
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}><Beaker color="#b45309" size={20}/> Lab Results</h3>
              {filteredLabs.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  {filteredLabs.map((l, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: '600' }}>{l.test}</span>
                    <span>{l.value} {l.unit}</span>
                  </div>)}
                </div>
              ) : <PrivacyBar />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PrivacyBar = () => (
  <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '1rem', border: '1px dashed #cbd5e1', textAlign: 'center', marginTop: '1rem' }}>
    <ShieldAlert color="#c2410c" size={24} />
    <p style={{ fontWeight: '800', margin: '0.5rem 0 0' }}>Information Restricted</p>
    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Managed by guardian settings.</p>
  </div>
);

export default PatientPortal;
