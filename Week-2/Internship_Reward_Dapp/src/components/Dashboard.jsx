import { useState, useEffect } from 'react';
import { internAPI, taskAPI } from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard({ selectedIntern }) {
    const [stats, setStats] = useState({
        totalInterns: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
    });
    const [recentInterns, setRecentInterns] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch interns
            const internsData = await internAPI.getAll({ limit: 5 });
            setRecentInterns(internsData.data || []);

            // Fetch tasks
            const tasksData = await taskAPI.getAll({ limit: 10 });
            setRecentTasks(tasksData.data || []);

            // Fetch task stats
            const taskStats = await taskAPI.getStats();

            // Calculate stats
            setStats({
                totalInterns: internsData.total || 0,
                totalTasks: tasksData.total || 0,
                completedTasks: taskStats.data?.byStatus?.find(s => s._id === 'Approved')?.count || 0,
                pendingTasks: tasksData.data?.filter(t => t.status === 'Pending').length || 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading text-center" style={{ padding: '4rem' }}>
                    <h2>Loading Dashboard...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in">
            <h1>📊 Dashboard</h1>
            <p className="text-secondary mb-lg">
                Welcome to the Internship Reward Platform
            </p>

            {/* Stats Grid */}
            <div className="grid grid-4 mb-xl">
                <div className="stat-card">
                    <div className="stat-label">Total Interns</div>
                    <div className="stat-value">{stats.totalInterns}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Tasks</div>
                    <div className="stat-value">{stats.totalTasks}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Completed Tasks</div>
                    <div className="stat-value">{stats.completedTasks}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Tasks</div>
                    <div className="stat-value">{stats.pendingTasks}</div>
                </div>
            </div>

            <div className="grid grid-2">
                {/* Recent Interns */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">👥 Recent Interns</h3>
                    </div>
                    <div className="table-container">
                        {recentInterns.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInterns.map((intern) => (
                                        <tr key={intern._id}>
                                            <td>{intern.name}</td>
                                            <td>{intern.department}</td>
                                            <td>
                                                <span className={`badge badge-${intern.status === 'Active' ? 'success' : 'secondary'}`}>
                                                    {intern.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-muted text-center">No interns registered yet</p>
                        )}
                    </div>
                    <div className="mt-md">
                        <Link to="/register" className="btn btn-primary btn-sm">
                            Register New Intern
                        </Link>
                    </div>
                </div>

                {/* Recent Tasks */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">✅ Recent Tasks</h3>
                    </div>
                    <div className="table-container">
                        {recentTasks.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTasks.slice(0, 5).map((task) => (
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-muted text-center">No tasks submitted yet</p>
                        )}
                    </div>
                    <div className="mt-md">
                        <Link to="/tasks" className="btn btn-primary btn-sm">
                            Manage Tasks
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-xl">
                <h3>🚀 Quick Actions</h3>
                <div className="grid grid-3 mt-md">
                    <Link to="/register" className="btn btn-primary">
                        Register Intern
                    </Link>
                    <Link to="/tasks" className="btn btn-primary">
                        Submit Task
                    </Link>
                    <Link to="/nfts" className="btn btn-primary">
                        View NFT Gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
