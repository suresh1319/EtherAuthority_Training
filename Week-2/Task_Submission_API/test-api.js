// Test script for Task Submission API
console.log('🧪 Testing Task Submission API on port 3001...\n');

const BASE_URL = 'http://localhost:3001';

// Test 1: Get API Info
async function testAPIInfo() {
    try {
        const response = await fetch(BASE_URL);
        const data = await response.json();
        console.log('✅ Test 1: API Info');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 1 Failed:', error.message);
    }
}

// Test 2: Submit First Task (Pending)
async function testSubmitTask1() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Build Authentication System',
                description: 'Implement JWT-based authentication',
                internId: 'INTERN001',
                internName: 'John Doe',
                dueDate: '2024-01-25',
                priority: 'High'
            })
        });
        const data = await response.json();
        console.log('✅ Test 2: Submit Task (Pending)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        return data.data._id;
    } catch (error) {
        console.error('❌ Test 2 Failed:', error.message);
    }
}

// Test 3: Submit Second Task (with submission)
async function testSubmitTask2() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Create REST API Documentation',
                description: 'Document all endpoints with examples',
                internId: 'INTERN001',
                internName: 'John Doe',
                submissionUrl: 'https://github.com/johndoe/api-docs',
                dueDate: '2024-01-20',
                priority: 'Medium'
            })
        });
        const data = await response.json();
        console.log('✅ Test 3: Submit Task (with URL - Submitted)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        return data.data._id;
    } catch (error) {
        console.error('❌ Test 3 Failed:', error.message);
    }
}

// Test 4: Submit Third Task for different intern
async function testSubmitTask3() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Database Schema Design',
                description: 'Design MongoDB schemas for the project',
                internId: 'INTERN002',
                internName: 'Sarah Wilson',
                submissionUrl: 'https://github.com/sarah/schema-design',
                dueDate: '2024-01-18',
                priority: 'High'
            })
        });
        const data = await response.json();
        console.log('✅ Test 4: Submit Task (Different Intern)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 4 Failed:', error.message);
    }
}

// Test 5: Get All Tasks
async function testGetAllTasks() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks`);
        const data = await response.json();
        console.log('✅ Test 5: Get All Tasks');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 5 Failed:', error.message);
    }
}

// Test 6: Get Tasks by Intern
async function testGetTasksByIntern() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/intern/INTERN001`);
        const data = await response.json();
        console.log('✅ Test 6: Get Tasks by Intern (INTERN001)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 6 Failed:', error.message);
    }
}

// Test 7: Get Task by ID
async function testGetTaskById(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/${id}`);
        const data = await response.json();
        console.log('✅ Test 7: Get Task by ID');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 7 Failed:', error.message);
    }
}

// Test 8: Update Task (add submission URL)
async function testUpdateTask(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submissionUrl: 'https://github.com/johndoe/auth-system',
                status: 'Submitted'
            })
        });
        const data = await response.json();
        console.log('✅ Test 8: Update Task (Add Submission)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 8 Failed:', error.message);
    }
}

// Test 9: Review Task
async function testReviewTask(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/${id}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reviewerComments: 'Excellent implementation! Clean code and good documentation.',
                score: 95,
                status: 'Approved'
            })
        });
        const data = await response.json();
        console.log('✅ Test 9: Review Task (Add Comments & Score)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 9 Failed:', error.message);
    }
}

// Test 10: Update Status
async function testUpdateStatus(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Reviewed' })
        });
        const data = await response.json();
        console.log('✅ Test 10: Update Status to Reviewed');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 10 Failed:', error.message);
    }
}

// Test 11: Filter Tasks by Status
async function testFilterByStatus() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks?status=Submitted`);
        const data = await response.json();
        console.log('✅ Test 11: Filter by Status (Submitted)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 11 Failed:', error.message);
    }
}

// Test 12: Get Task Statistics
async function testGetStats() {
    try {
        const response = await fetch(`${BASE_URL}/api/tasks/stats/summary`);
        const data = await response.json();
        console.log('✅ Test 12: Get Task Statistics');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 12 Failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testAPIInfo();
    const task1Id = await testSubmitTask1();
    const task2Id = await testSubmitTask2();
    await testSubmitTask3();
    await testGetAllTasks();
    await testGetTasksByIntern();

    if (task1Id) {
        await testGetTaskById(task1Id);
        await testUpdateTask(task1Id);
        await testReviewTask(task1Id);
    }

    if (task2Id) {
        await testUpdateStatus(task2Id);
    }

    await testFilterByStatus();
    await testGetStats();

    console.log('🎉 All tests completed!');
}

runAllTests();
