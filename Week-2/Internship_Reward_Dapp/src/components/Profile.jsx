import { useState, useEffect } from 'react';
import { internAPI, taskAPI } from '../services/api';

function Profile({ selectedIntern, setSelectedIntern }) {
    const [interns, setInterns] = useState([]);
    const [internData, setInternData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInterns();
    }, []);

    useEffect(() => {
        if (selectedIntern) {
            fetchInternProfile();
        }
    }, [selectedIntern]);

    const fetchInterns = async () => {
        try {
            const response = await internAPI.getAll();
            setInterns(response.data || []);
            if (!selectedIntern && response.data?.length > 0) {
                setSelectedIntern(response.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching interns:', error);
        }
    };

    const fetchInternProfile = async () => {
        setLoading(true);
        try {
            // Fetch intern details
            const internResponse = await internAPI.getById(selectedIntern);
            setInternData(internResponse.data);

            // Fetch intern's tasks
            const tasksResponse = await taskAPI.getByIntern(selectedIntern);
            const tasksData = tasksResponse.data || [];
            setTasks(tasksData);

            // Calculate statistics
            const totalTasks = tasksData.length;
            const completedTasks = tasksData.filter(t => t.status === 'Approved').length;
            const pendingTasks = tasksData.filter(t => t.status === 'Pending').length;
            const avgScore = tasksData.filter(t => t.score).length > 0
                ? Math.round(tasksData.reduce((sum, t) => sum + (t.score || 0), 0) / tasksData.filter(t => t.score).length)
                : 0;

            setStats({
                totalTasks,
                completedTasks,
                pendingTasks,
                avgScore,
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedIntern) {
        return (
            <div className="container">
                <div className="card text-center" style={{ padding: '4rem' }}>
                    <h2>No Intern Selected</h2>
                    <p className="text-secondary">Please select an intern or register a new one</p>
                </div>
            </div>
        );
    }

    if (loading || !internData) {
        return (
            <div className="container">
                <div className="loading text-center" style={{ padding: '4rem' }}>
                    <h2>Loading Profile...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in">
            <h1>👤 Intern Profile</h1>

            {/* Intern Selector */}
            <div className="card mb-lg">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Intern</label>
                    <select
                        className="form-select"
                        value={selectedIntern}
                        onChange={(e) => setSelectedIntern(e.target.value)}
                    >
                        {interns.map((intern) => (
                            <option key={intern._id} value={intern._id}>
                                {intern.name} - {intern.email}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-3 mb-xl">
                {/* Profile Info Card */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3>Personal Information</h3>
                    <div className="grid grid-2 mt-md">
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Name
                            </div>
                            <div style={{ fontWeight: '600' }}>{internData.name}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Email
                            </div>
                            <div style={{ fontWeight: '600' }}>{internData.email}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Phone
                            </div>
                            <div style={{ fontWeight: '600' }}>{internData.phone || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Department
                            </div>
                            <div style={{ fontWeight: '600' }}>{internData.department}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Mentor
                            </div>
                            <div style={{ fontWeight: '600' }}>{internData.mentor || 'Not Assigned'}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                Status
                            </div>
                            <span className={`badge badge-${internData.status === 'Active' ? 'success' : 'secondary'}`}>
                                {internData.status}
                            </span>
                        </div>
                    </div>

                    {internData.skills && internData.skills.length > 0 && (
                        <div className="mt-lg">
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Skills
                            </div>
                            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                {internData.skills.map((skill, index) => (
                                    <span key={index} className="badge badge-primary">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Card */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: 'white',
                    border: 'none',
                }}>
                    <h4 style={{ color: 'white', marginBottom: 'var(--spacing-lg)' }}>Performance</h4>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.avgScore}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Average Score</div>
                    </div>
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.completedTasks}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Completed Tasks</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.totalTasks}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Tasks</div>
                    </div>
                </div>
            </div>

            {/* Task History */}
            <div className="card">
                <h3>Task History ({tasks.length})</h3>
                {tasks.length > 0 ? (
                    <div className="table-container mt-md">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Score</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task._id}>
                                        <td>{task.title}</td>
                                        <td>
                                            <span className={`badge badge-${task.status === 'Approved' ? 'success' :
                                                    task.status === 'Submitted' ? 'primary' :
                                                        task.status === 'Rejected' ? 'error' : 'secondary'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${task.priority === 'High' ? 'error' :
                                                    task.priority === 'Medium' ? 'warning' : 'secondary'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>{task.score || '-'}</td>
                                        <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center">No tasks found</p>
                )}
            </div>
        </div>
    );
}

export default Profile;
