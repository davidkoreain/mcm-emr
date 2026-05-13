import React, { useState } from 'react';
import { UserPlus, Search, ShieldCheck, ArrowRight, X, UserSearch } from 'lucide-react';
import { useEMR, type Patient } from '../context/EMRContext';

const PatientSignup: React.FC<{ onBack: () => void; onLogin: (mrn: string) => void }> = ({ onBack, onLogin }) => {
  const { matchPatient, registerPatientUser, setCurrentUser, addPatient, isPortalUserRegistered, loginPortalUser } = useEMR();
  const [step, setStep] = useState<'selection' | 'match' | 'register' | 'new' | 'login-direct' | 'login-password'>('selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match Form
  const [matchData, setMatchData] = useState({ name: '', dob: '', phone: '' });
  const [matchedPatient, setMatchedPatient] = useState<any>(null);

  // New Patient Form
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female'
  });

  // Register Form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Direct Login Form
  const [loginData, setLoginData] = useState({ name: '', password: '' });

  const generateMRN = () => `MRN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const p = await matchPatient(matchData.name.trim(), matchData.dob, matchData.phone.trim());
      if (p) {
        setMatchedPatient(p);
        const registered = await isPortalUserRegistered(p.mrn);
        if (registered) {
          setStep('login-password');
        } else {
          setStep('register');
        }
      } else {
        setError('No matching patient record found. Please ensure your Name, DOB, and Phone match your hospital record. (기존 환자 기록을 찾을 수 없습니다. 이름, 생년월일, 전화번호가 병원 기록과 일치하는지 확인해 주세요.)');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loginName = step === 'login-password' ? matchedPatient.name : loginData.name;
      const pwd = step === 'login-password' ? password : loginData.password;
      
      const p = await loginPortalUser(loginName, pwd);
      if (p) {
        setCurrentUser(p);
        onLogin(p.mrn);
      } else {
        setError('Invalid MRN or Password. (의료등록번호 또는 비밀번호가 올바르지 않습니다.)');
      }
    } catch (err: any) {
      setError('Login failed. (로그인에 실패했습니다.)');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const mrn = generateMRN();
    const newPatient: Patient = {
      mrn,
      name: `${newPatientData.firstName} ${newPatientData.lastName}`.trim(),
      amharic: '',
      visitType: 'OPD',
      status: 'Waiting',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      registeredAt: new Date().toISOString().slice(0, 10),
      gender: newPatientData.gender,
      dob: newPatientData.dob,
      phone: newPatientData.phone,
      city: 'Addis Ababa',
      woreda: '',
      kebele: '',
      vitals: [],
      medications: [],
      ward: '',
    };

    try {
      await addPatient(newPatient);
      setMatchedPatient(newPatient);
      setStep('register');
    } catch (err: any) {
      setError('Failed to create patient record. (환자 기록 생성에 실패했습니다.)');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. (비밀번호가 일치하지 않습니다.)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerPatientUser(matchedPatient.mrn, password);
      setCurrentUser(matchedPatient);
      onLogin(matchedPatient.mrn);
    } catch (err: any) {
      setError('Registration failed. You may already have an account. (가입에 실패했습니다. 이미 계정이 있을 수 있습니다.)');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.98)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' };
  const cardStyle: React.CSSProperties = { maxWidth: '480px', width: '100%', background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
              {step === 'selection' && 'Patient Portal (환자 포털)'}
              {step === 'match' && 'Find My Record (기본 정보 찾기)'}
              {step === 'new' && 'New Registration (신규 가입)'}
              {step === 'register' && 'Create Your Account (계정 생성)'}
              {step === 'login-direct' && 'Portal Login (포털 로그인)'}
              {step === 'login-password' && 'Enter Password (비밀번호 입력)'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              {step === 'selection' && 'Choose your entry path (가입 방법을 선택해 주세요)'}
              {step === 'match' && 'Verify your hospital record to continue (병원 기록을 확인해 주세요)'}
              {step === 'new' && 'Enter your details to create a new record (기본 정보를 입력해 주세요)'}
              {step === 'register' && 'Set your secure password (보안 비밀번호를 설정해 주세요)'}
              {step === 'login-direct' && 'Sign in with your Name and password (이름과 비밀번호로 로그인)'}
              {step === 'login-password' && `Welcome back, ${matchedPatient?.name}`}
            </p>
          </div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
            {error}
          </div>
        )}

        {step === 'selection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => setStep('login-direct')}
              style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', background: '#f8fafc', border: '2px solid #2563eb', borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            >
              <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '0.75rem' }}>
                <ShieldCheck size={28} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>I have an account (이미 계정이 있습니다)</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Login with Name and Password (로그인하기)</div>
              </div>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>OR (또는)</div>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            </div>

            <button 
              onClick={() => setStep('match')}
              style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseOut={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem' }}>
                <Search size={28} color="#64748b" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>Existing Patient (병원 기록 찾기)</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>First time portal user with hospital record (병원 기록은 있지만 포털이 처음인 경우)</div>
              </div>
            </button>

            <button 
              onClick={() => setStep('new')}
              style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = '#db2777')}
              onMouseOut={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ background: '#fce7f3', padding: '1rem', borderRadius: '0.75rem' }}>
                <UserPlus size={28} color="#db2777" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>New Patient (신규 환자 가입)</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>I am a completely new patient at MCM (병원 방문이 처음인 경우)</div>
              </div>
            </button>
          </div>
        )}

        {step === 'match' && (
          <form onSubmit={handleMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Full Name (영문 이름)</label>
              <input type="text" required placeholder="e.g. Abebe Bikila" value={matchData.name} onChange={e => setMatchData(d => ({ ...d, name: e.target.value }))} 
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Date of Birth (생년월일)</label>
              <input type="date" required value={matchData.dob} onChange={e => setMatchData(d => ({ ...d, dob: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Phone Number (전화번호)</label>
              <input type="tel" required placeholder="e.g. +251911001001" value={matchData.phone} onChange={e => setMatchData(d => ({ ...d, phone: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
              {loading ? 'Searching...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Find My Record <ArrowRight size={18} /></span>}
            </button>
            <button type="button" onClick={() => setStep('selection')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}>Back to selection (이전으로)</button>
          </form>
        )}

        {step === 'new' && (
          <form onSubmit={handleNewPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>First Name (이름)</label>
                <input type="text" required placeholder="Abebe" value={newPatientData.firstName} onChange={e => setNewPatientData(d => ({ ...d, firstName: e.target.value }))} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Last Name (성)</label>
                <input type="text" required placeholder="Bikila" value={newPatientData.lastName} onChange={e => setNewPatientData(d => ({ ...d, lastName: e.target.value }))} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Date of Birth (생년월일)</label>
              <input type="date" required value={newPatientData.dob} onChange={e => setNewPatientData(d => ({ ...d, dob: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Phone Number (전화번호)</label>
              <input type="tel" required placeholder="e.g. +251911001001" value={newPatientData.phone} onChange={e => setNewPatientData(d => ({ ...d, phone: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Gender (성별)</label>
              <select value={newPatientData.gender} onChange={e => setNewPatientData(d => ({ ...d, gender: e.target.value as any }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }}>
                <option value="Male">Male (남성)</option>
                <option value="Female">Female (여성)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', background: '#db2777' }}>
              {loading ? 'Registering...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Create Patient Record <UserSearch size={18} /></span>}
            </button>
            <button type="button" onClick={() => setStep('selection')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}>Back to selection (이전으로)</button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #dcfce7', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>Record Found (기록 찾음)</div>
              <div style={{ fontWeight: '700', color: '#166534' }}>{matchedPatient.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#166534' }}>MRN: {matchedPatient.mrn}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Create Password (비밀번호 생성)</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Confirm Password (비밀번호 확인)</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', background: '#2563eb' }}>
              {loading ? 'Creating...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Complete Signup <ShieldCheck size={18} /></span>}
            </button>
            <button type="button" onClick={() => setStep('selection')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}>Change Record (다른 기록 선택)</button>
          </form>
        )}

        {step === 'login-direct' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Full Name (영문 성함)</label>
              <input type="text" required placeholder="e.g. Abebe Bikila" value={loginData.name} onChange={e => setLoginData(d => ({ ...d, name: e.target.value }))} 
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Password (비밀번호)</label>
              <input type="password" required value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
              {loading ? 'Logging in...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Login <ArrowRight size={18} /></span>}
            </button>
            <button type="button" onClick={() => setStep('selection')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}>Back to selection (이전으로)</button>
          </form>
        )}

        {step === 'login-password' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #bfdbfe', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600', textTransform: 'uppercase' }}>Existing Account Found (기존 계정 찾음)</div>
              <div style={{ fontWeight: '700', color: '#1e40af' }}>{matchedPatient.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>MRN: {matchedPatient.mrn}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Enter Password (비밀번호 입력)</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', background: '#2563eb' }}>
              {loading ? 'Logging in...' : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Login <ArrowRight size={18} /></span>}
            </button>
            <button type="button" onClick={() => setStep('selection')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}>Back to selection (이전으로)</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientSignup;
