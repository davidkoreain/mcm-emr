import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Shield, Heart, FileText, Beaker, Scissors, Save, LogOut, Settings } from 'lucide-react';
import { useEMR, type GuardianUser } from '../context/EMRContext';
import PatientPortal from './PatientPortal';
import Avatar from './Avatar';

const toast = { success: (m: string) => alert(m), error: (m: string) => alert(m) };

const GuardianPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return <PatientPortal onLogout={onLogout} isGuardianView={true} />;
};

export default GuardianPortal;
