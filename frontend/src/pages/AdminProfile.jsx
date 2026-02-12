import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Key, Save } from 'lucide-react';
import api, { getStoredUser } from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Logo from '../components/Logo';
import { toastSuccess, toastError } from '../components/Toast';

export default function AdminProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [nameDraft, setNameDraft] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = getStoredUser();
    if (!token || user?.role !== 'ADMIN') {
      navigate('/admin/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  useEffect(() => {
    setNameDraft(admin?.name ?? '');
  }, [admin?.name]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/admin/profile');
      setAdmin(res.data.admin);
    } catch (error) {
      console.error('Failed to load profile:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = (nameDraft ?? '').trim();
    setSavingName(true);
    try {
      const res = await api.put('/admin/profile', { name: trimmed || null });
      setAdmin(res.data.admin);
      const user = getStoredUser();
      if (user) {
        user.name = res.data.admin.name ?? null;
        localStorage.setItem('user', JSON.stringify(user));
      }
      toastSuccess('Name updated successfully');
    } catch (error) {
      toastError(error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toastError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toastError('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/admin/profile/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toastSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading />
      </div>
    );
  }

  return (
    <div className="admin-profile-root" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .admin-profile-root { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
        @media (max-width: 768px) {
          .admin-profile-header { flex-wrap: wrap; gap: 12px; padding: 12px 16px !important; }
          .admin-profile-content { margin: 24px auto !important; padding: 0 16px !important; }
          .admin-profile-card { padding: 24px !important; }
        }
      `}</style>
      <div className="admin-profile-header" style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Logo size="small" />
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/admin/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <div className="admin-profile-content" style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '0 24px',
      }}>
        <div className="admin-profile-card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
            Admin Profile
          </h1>

          <form onSubmit={handleSaveName}>
            <Input
              label="Name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your display name"
            />
            <Button type="submit" icon={Save} disabled={savingName} style={{ marginTop: '16px' }}>
              {savingName ? 'Saving...' : 'Save name'}
            </Button>
          </form>

          <div style={{ marginTop: '24px' }}>
            <Input
              label="Username"
            value={admin?.username || ''}
            disabled
            readOnly
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              cursor: 'not-allowed',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
            }}
            />
          </div>

          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Change Password</h3>
              <Button
                variant="outline"
                icon={KeyRound}
                onClick={() => {
                  setShowPasswordChange(!showPasswordChange);
                  if (showPasswordChange) setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </Button>
            </div>
            {showPasswordChange && (
              <form onSubmit={handlePasswordChange}>
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
                <Button type="submit" icon={Key} disabled={changingPassword} style={{ marginTop: '16px' }}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
