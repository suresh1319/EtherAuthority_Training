// Test script for Intern Registration API
console.log('🧪 Testing Intern Registration API...\n');

const BASE_URL = 'http://localhost:3000';

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

// Test 2: Register First Intern
async function testRegisterIntern1() {
    try {
        const response = await fetch(`${BASE_URL}/api/interns/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                skills: ['JavaScript', 'React', 'Node.js'],
                department: 'Engineering',
                mentor: 'Jane Smith'
            })
        });
        const data = await response.json();
        console.log('✅ Test 2: Register First Intern');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        return data.data._id;
    } catch (error) {
        console.error('❌ Test 2 Failed:', error.message);
    }
}

// Test 3: Register Second Intern
async function testRegisterIntern2() {
    try {
        const response = await fetch(`${BASE_URL}/api/interns/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Sarah Wilson',
                email: 'sarah.w@example.com',
                phone: '+9876543210',
                skills: ['Python', 'Django', 'PostgreSQL'],
                department: 'Engineering',
                mentor: 'Bob Johnson'
            })
        });
        const data = await response.json();
        console.log('✅ Test 3: Register Second Intern');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 3 Failed:', error.message);
    }
}

// Test 4: Get All Interns
async function testGetAllInterns() {
    try {
        const response = await fetch(`${BASE_URL}/api/interns`);
        const data = await response.json();
        console.log('✅ Test 4: Get All Interns');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 4 Failed:', error.message);
    }
}

// Test 5: Get Intern by ID
async function testGetInternById(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/interns/${id}`);
        const data = await response.json();
        console.log('✅ Test 5: Get Intern by ID');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 5 Failed:', error.message);
    }
}

// Test 6: Update Intern
async function testUpdateIntern(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/interns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'John Doe Updated',
                skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express']
            })
        });
        const data = await response.json();
        console.log('✅ Test 6: Update Intern');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 6 Failed:', error.message);
    }
}

// Test 7: Update Status
async function testUpdateStatus(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/interns/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Completed' })
        });
        const data = await response.json();
        console.log('✅ Test 7: Update Status to Completed');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 7 Failed:', error.message);
    }
}

// Test 8: Filter by Status
async function testFilterByStatus() {
    try {
        const response = await fetch(`${BASE_URL}/api/interns?status=Active`);
        const data = await response.json();
        console.log('✅ Test 8: Filter by Status (Active)');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 8 Failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testAPIInfo();
    const internId = await testRegisterIntern1();
    await testRegisterIntern2();
    await testGetAllInterns();
    if (internId) {
        await testGetInternById(internId);
        await testUpdateIntern(internId);
        await testUpdateStatus(internId);
    }
    await testFilterByStatus();

    console.log('🎉 All tests completed!');
}

runAllTests();
