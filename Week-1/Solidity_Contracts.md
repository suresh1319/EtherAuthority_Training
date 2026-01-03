# Sepolia Smart Contract Testing Report (Corrected)

Network: **Sepolia Testnet**  
Tester: **Suresh**

---

## 1️⃣ Counter Contract  
**Address:** `0x9C2c588D064C9c8dA7700333b9a19A25B53d61A0`

### Test Case 1: Initial Count
- Action: Call `count()`
- Expected Result: Returns `0`
- Status: ✅ Passed

### Test Case 2: Increment
- Action: Call `increment()`
- Expected Result: Count increases by 1
- Status: ✅ Passed

### Test Case 3: Decrement
- Action: Call `decrement()`
- Expected Result: Count decreases by 1
- Status: ✅ Passed

---

## 2️⃣ Student Registration Contract  
**Address:** `0xE8e64087D5cffFd7DE5A6Df1755B7333a83f857B`

### Test Case 1: Register Student
- Action: Call `register("Suresh", 21)`
- Expected Result: Student details stored
- Status: ✅ Passed

### Test Case 2: Fetch Student Details
- Action: Call `students(userAddress)`
- Expected Result: Correct name and age returned
- Status: ✅ Passed

---

## 3️⃣ Account Ownership Contract  
**Address:** `0x7A76AD19B22a2789A597C54f46fEbBC24486A7d4`

### Test Case 1: Creator Address
- Action: Call `creator()`
- Expected Result: Returns deployer address
- Status: ✅ Passed

### Test Case 2: Owner Verification
- Action: Call `isOwner()` from deployer account
- Expected Result: Returns `true`
- Status: ✅ Passed

### Test Case 3: Non-Owner Check
- Action: Call `isOwner()` from another account
- Expected Result: Returns `false`
- Status: ✅ Passed

---

## 4️⃣ Hello World Contract  
**Address:** `0xC9F099DC71819aC12D1f7b2A35A80F1279f54327`

### Test Case 1: Read Message Variable
- Action: Call `message()`
- Expected Result: `"Hello World"`
- Status: ✅ Passed

### Test Case 2: getMessage Function
- Action: Call `getMessage()`
- Expected Result: `"Hello World"`
- Status: ✅ Passed

---

## 5️⃣ Internship Tracker Contract  
**Address:** `0x0960391791B6aE0D58c70F06Bb7964efeE4BC916`

### Test Case 1: Add Task
- Action: Call `addTask("Learn Solidity")`
- Expected Result: Task added with completed = false
- Status: ✅ Passed

### Test Case 2: Update Task Status
- Action: Call `updateStatus(0, true)`
- Expected Result: Task marked completed
- Status: ✅ Passed

### Test Case 3: Task Count
- Action: Call `taskCount()`
- Expected Result: Task count increases
- Status: ✅ Passed

---

## 6️⃣ Voting Contract  
**Address:** `0x133C1967896a565a9d75a3E8234d641A124870ab`

### Test Case 1: Vote
- Action: Call `vote("Alice")`
- Expected Result: Vote count increases
- Status: ✅ Passed

### Test Case 2: Get Votes
- Action: Call `getVotes("Alice")`
- Expected Result: Correct vote count returned
- Status: ✅ Passed

---

## 7️⃣ Ownable Contract  
**Address:** `0xAF05b50Be69c17E509076BD61D4bcb008B03Ed8C`

### Test Case 1: Check Owner
- Action: Call `owner()`
- Expected Result: Deployer address returned
- Status: ✅ Passed

### Test Case 2: Change Owner (Authorized)
- Action: Call `changeOwner(newAddress)` from owner
- Expected Result: Owner updated
- Status: ✅ Passed

### Test Case 3: Change Owner (Unauthorized)
- Action: Call `changeOwner()` from non-owner
- Expected Result: Transaction reverted
- Status: ✅ Passed

---

## 8️⃣ Ether Transfer Contract  
**Address:** `0x075B70e3fE16350C891DAC06Ec3EB57C3D524E76`

### Test Case 1: Send Ether
- Action: Call `sendEther()` with ETH
- Expected Result: Ether transferred successfully
- Status: ✅ Passed

### Test Case 2: Contract Balance
- Action: Call `getBalance()`
- Expected Result: Correct balance returned
- Status: ✅ Passed

---

## 9️⃣ Simple Storage Contract  
**Address:** `0x750aaA22E5befbC23DDa313c2C02Ef9AFeB945eB`

### Test Case 1: Initial Data
- Action: Call `data()`
- Expected Result: Returns `0`
- Status: ✅ Passed

### Test Case 2: Set Data
- Action: Call `set(100)`
- Expected Result: Data updated to `100`
- Status: ✅ Passed

---

✅ All contracts are **correctly mapped, deployed, tested, and verified** on Sepolia Testnet.
