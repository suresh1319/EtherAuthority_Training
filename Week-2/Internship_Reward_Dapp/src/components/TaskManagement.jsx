import { useState, useEffect } from 'react';
import { internAPI, taskAPI } from '../services/api';

function TaskManagement({ selectedIntern, setSelectedIntern }) {
    const [interns, setInterns] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        internId: '',
        dueDate: '',
        priority: 'Medium',
        submissionUrl: '',
    });

    const [reviewData, setReviewData] = useState({
        reviewerComments: '',
        score: '',
        status: 'Reviewed',
    });

    useEffect(() => {
        fetchInterns();
        fetchTasks();
    }, [selectedIntern]);

    const fetchInterns = async () => {
        try {
            const response = await internAPI.getAll();
            setInterns(response.data || []);
        } catch (error) {
            console.error('Error fetching interns:', error);
        }
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let response;
            if (selectedIntern) {
                response = await taskAPI.getByIntern(selectedIntern);
            } else {
                response = await taskAPI.getAll({ limit: 50 });
            }
            setTasks(response.data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const intern = interns.find(i => i._id === formData.internId);
            await taskAPI.submit({
                ...formData,
                internName: intern?.name,
            });
            alert('Task submitted successfully!');
            setShowSubmitForm(false);
            setFormData({
                title: '',
                description: '',
                internId: '',
                dueDate: '',
                priority: 'Medium',
                submissionUrl: '',
            });
            fetchTasks();
        } catch (error) {
            alert('Failed to submit task: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        try {
            await taskAPI.review(selectedTask._id, {
                ...reviewData,
                score: parseInt(reviewData.score),
            });
            alert('Task reviewed successfully!');
            setShowReviewModal(false);
            setSelectedTask(null);
            setReviewData({ reviewerComments: '', score: '', status: 'Reviewed' });
            fetchTasks();
        } catch (error) {
            alert('Failed to review task: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="container fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>✅ Task Management</h1>
                    <p className="text-secondary">Submit and manage intern tasks</p>
                </div>
                <button
                    onClick={() => setShowSubmitForm(!showSubmitForm)}
                    className="btn btn-primary"
                >
                    {showSubmitForm ? 'Cancel' : '+ Submit New Task'}
                </button>
            </div>

            {/* Intern Filter */}
            <div className="card mb-lg">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Filter by Intern</label>
                    <select
                        className="form-select"
                        value={selectedIntern || ''}
                        onChange={(e) => setSelectedIntern(e.target.value || null)}
                    >
                        <option value="">All Interns</option>
                        {interns.map((intern) => (
                            <option key={intern._id} value={intern._id}>
                                {intern.name} - {intern.email}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Submit Form */}
            {showSubmitForm && (
                <div className="card mb-lg">
                    <h3>Submit New Task</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Task Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Intern *</label>
                                <select
                                    className="form-select"
                                    value={formData.internId}
                                    onChange={(e) => setFormData({ ...formData, internId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Intern</option>
                                    {interns.map((intern) => (
                                        <option key={intern._id} value={intern._id}>{intern.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-3">
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    className="form-select"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Submission URL</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.submissionUrl}
                                    onChange={(e) => setFormData({ ...formData, submissionUrl: e.target.value })}
                                    placeholder="https://github.com/..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">Submit Task</button>
                    </form>
                </div>
            )}

            {/* Tasks Table */}
            <div className="card">
                <h3>All Tasks ({tasks.length})</h3>
                {loading ? (
                    <p className="loading">Loading tasks...</p>
                ) : tasks.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Intern</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Score</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task._id}>
                                        <td>{task.title}</td>
                                        <td>{task.internName || task.internId}</td>
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
                                        <td>
                                            <button
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowReviewModal(true);
                                                }}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center">No tasks found</p>
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedTask && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Review Task</h3>
                            <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
                        </div>
                        <div className="mb-md">
                            <strong>{selectedTask.title}</strong>
                            <p className="text-secondary">{selectedTask.description}</p>
                        </div>
                        <form onSubmit={handleReview}>
                            <div className="form-group">
                                <label className="form-label">Comments</label>
                                <textarea
                                    className="form-textarea"
                                    value={reviewData.reviewerComments}
                                    onChange={(e) => setReviewData({ ...reviewData, reviewerComments: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="form-input"
                                        value={reviewData.score}
                                        onChange={(e) => setReviewData({ ...reviewData, score: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={reviewData.status}
                                        onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                                    >
                                        <option value="Reviewed">Reviewed</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary">Submit Review</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskManagement;
