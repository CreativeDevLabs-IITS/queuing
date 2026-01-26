import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { saveQueueEntry } from '../utils/queueStorage';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Logo from '../components/Logo';

export default function ClientJoin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    clientType: 'REGULAR',
    categoryId: '',
    subCategoryId: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    setSubCategories(category?.subCategories || []);
    setFormData({
      ...formData,
      categoryId,
      subCategoryId: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Name is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/queue/join', {
        clientName: formData.clientName.trim(),
        clientType: formData.clientType,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || null,
      });

      // Save to localStorage
      const queueEntry = {
        queueNumber: res.data.queueEntry.queueNumber,
        clientName: res.data.queueEntry.clientName,
        date: res.data.queueEntry.date,
        category: res.data.queueEntry.category.name,
        subCategory: res.data.queueEntry.subCategory?.name || null,
        clientType: res.data.queueEntry.clientType,
        status: res.data.queueEntry.status,
      };
      saveQueueEntry(queueEntry);

      navigate('/success');
    } catch (error) {
      console.error('Failed to join queue:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to join queue' });
    } finally {
      setSubmitting(false);
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <Logo size="medium" />
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1e293b',
          textAlign: 'center',
        }}>
          Join Queue
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          Fill in your details to get a queue number
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Your Name"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            error={errors.clientName}
            placeholder="Enter your full name"
            required
          />

          <Select
            label="Client Type"
            value={formData.clientType}
            onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
          >
            <option value="REGULAR">Regular</option>
            <option value="SENIOR_CITIZEN">Senior Citizen</option>
            <option value="PWD">PWD</option>
            <option value="PREGNANT">Pregnant</option>
          </Select>

          <Select
            label="Concern Category"
            value={formData.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            error={errors.categoryId}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {subCategories.length > 0 && (
            <Select
              label="Sub-Concern (Optional)"
              value={formData.subCategoryId}
              onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
            >
              <option value="">None</option>
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          )}

          {errors.submit && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={submitting}
            style={{ marginTop: '8px' }}
          >
            {submitting ? 'Joining...' : 'Join Queue'}
          </Button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <a
            href="/monitor"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            View Queue Status →
          </a>
        </div>
      </div>
    </div>
  );
}
