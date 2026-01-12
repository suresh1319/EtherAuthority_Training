import { useState } from 'react';
import { internAPI } from '../services/api';

function InternRegistration() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        skills: '',
        department: 'Engineering',
        mentor: '',
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Convert skills string to array
            const skills = formData.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill);

            const submitData = {
                ...formData,
                skills,
            };

            await internAPI.register(submitData);
            setSuccess(true);

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                skills: '',
                department: 'Engineering',
                mentor: '',
            });

            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to register intern');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in">
            <h1>👥 Register New Intern</h1>
            <p className="text-secondary mb-lg">
                Fill out the form below to register a new intern
            </p>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {success && (
                    <div className="alert" style={{
                        background: 'var(--success)',
                        color: 'white',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        ✅ Intern registered successfully!
                    </div>
                )}

                {error && (
                    <div className="alert" style={{
                        background: 'var(--error)',
                        color: 'white',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1234567890"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Skills (comma-separated)</label>
                        <input
                            type="text"
                            name="skills"
                            className="form-input"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="JavaScript, React, Node.js"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Department *</label>
                        <select
                            name="department"
                            className="form-select"
                            value={formData.department}
                            onChange={handleChange}
                            required
                        >
                            <option value="Engineering">Engineering</option>
                            <option value="Marketing">Marketing</option>
                            <option value="HR">HR</option>
                            <option value="Sales">Sales</option>
                            <option value="Design">Design</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mentor</label>
                        <input
                            type="text"
                            name="mentor"
                            className="form-input"
                            value={formData.mentor}
                            onChange={handleChange}
                            placeholder="Jane Smith"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register Intern'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default InternRegistration;
