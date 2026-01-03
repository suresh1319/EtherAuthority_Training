# Sepolia Smart Contract Testing Report

Network: **Sepolia Testnet**  
Tester: **Suresh**

---

## 1️⃣ Counter Contract  
**Address:** `0x9C2c588D064C9c8dA7700333b9a19A25B53d61A0`

### Test Case 1: Initial Count
- **Action:** Call `count()`
- **Expected Result:** Returns `0`
- **Status:** ✅ Passed

### Test Case 2: Increment Count
- **Action:** Call `increment()`
- **Expected Result:** Count increases by 1
- **Status:** ✅ Passed

### Test Case 3: Decrement Count
- **Action:** Call `decrement()`
- **Expected Result:** Count decreases by 1
- **Status:** ✅ Passed

---

## 2️⃣ Student Registration Contract  
**Address:** `0xE8e64087D5cffFd7DE5A6Df1755B7333a83f857B`

### Test Case 1: Register Student
- **Action:** Call `register("Suresh", 21)`
- **Expected Result:** Student details stored for sender address
- **Status:** ✅ Passed

### Test Case 2: Read Student Data
- **Action:** Call `students(userAddress)`
- **Expected Result:** Returns correct name and age
- **Status:** ✅ Passed

---

## 3️⃣ Account Ownership Contract  
**Address:** `0xC9F099DC71819aC12D1f7b2A35A80F1279f54327`

### Test Case 1: Check Owner
- **Action:** Call `creator()`
- **Expected Result:** Returns deployer address
- **Status:** ✅ Passed

### Test Case 2: Verify Ownership
- **Action:** Call `isOwner()` from deployer account
- **Expected Result:** Returns `true`
- **Status:** ✅ Passed

### Test Case 3: Non-Owner Check
- **Action:** Call `isOwner()` from another account
- **Expected Result:** Returns `false`
- **Status:** ✅ Passed

---

## 4️⃣ Hello World Contract  
**Address:** `0x0960391791B6aE0D58c70F06Bb7964efeE4BC916`

### Test Case 1: Read Message
- **Action:** Call `message()`
- **Expected Result:** `"Hello World"`
- **Status:** ✅ Passed

### Test Case 2: getMessage Function
- **Action:** Call `getMessage()`
- **Expected Result:** `"Hello World"`
- **Status:** ✅ Passed

---

## 5️⃣ Internship Tracker Contract  
**Address:** `0x133C1967896a565a9d75a3E8234d641A124870ab`

### Test Case 1: Add Task
- **Action:** Call `addTask("Learn Solidity")`
- **Expected Result:** Task stored with `completed = false`
- **Status:** ✅ Passed

### Test Case 2: Update Task Status
- **Action:** Call `updateStatus(0, true)`
- **Expected Result:** Task marked as completed
- **Status:** ✅ Passed

### Test Case 3: Task Count
- **Action:** Call `taskCount()`
- **Expected Result:** Increases after adding task
- **Status:** ✅ Passed

---

## 6️⃣ Voting Contract  
**Address:** `0xAF05b50Be69c17E509076BD61D4bcb008B03Ed8C`

### Test Case 1: Vote for Candidate
- **Action:** Call `vote("Alice")`
- **Expected Result:** Vote count increases
- **Status:** ✅ Passed

### Test Case 2: Get Votes
- **Action:** Call `getVotes("Alice")`
- **Expected Result:** Returns correct vote count
- **Status:** ✅ Passed

---

## 7️⃣ Ownable Contract  
**Address:** `0x075B70e3fE16350C891DAC06Ec3EB57C3D524E76`

### Test Case 1: Owner Check
- **Action:** Call `owner()`
- **Expected Result:** Returns deployer address
- **Status:** ✅ Passed

### Test Case 2: Change Owner (Valid)
- **Action:** Call `changeOwner(newAddress)` from owner
- **Expected Result:** Owner updated
- **Status:** ✅ Passed

### Test Case 3: Change Owner (Invalid)
- **Action:** Call `changeOwner()` from non-owner
- **Expected Result:** Transaction reverted
- **Status:** ✅ Passed

---

## 8️⃣ Ether Transfer Contract  
**Address:** `0x750aaA22E5befbC23DDa313c2C02Ef9AFeB945eB`

### Test Case 1: Send Ether
- **Action:** Call `sendEther()` with ETH
- **Expected Result:** ETH transferred successfully
- **Status:** ✅ Passed

### Test Case 2: Contract Balance
- **Action:** Call `getBalance()`
- **Expected Result:** Returns correct ETH balance
- **Status:** ✅ Passed

---

## 9️⃣ Simple Storage Contract  
**Address:** `0x7A76AD19B22a2789A597C54f46fEbBC24486A7d4`

### Test Case 1: Initial Value
- **Action:** Call `data()`
- **Expected Result:** Returns `0`
- **Status:** ✅ Passed

### Test Case 2: Set Value
- **Action:** Call `set(100)`
- **Expected Result:** Data updated to `100`
- **Status:** ✅ Passed

---

✅ **All contracts deployed, tested, and verified successfully on Sepolia Testnet.**
