const app = require("./app");
const http = require("http");

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 1. Admin login
    console.log("\n[TEST 1] Admin login...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "admin123" }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log("✓ Admin login successful, token obtained.");

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 2. Existing Dashboard & Navigation endpoints
    console.log("\n[TEST 2] Testing existing dashboard and categories...");
    const existingDashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: authHeaders,
    });
    if (existingDashRes.status !== 200) {
      throw new Error(`Existing dashboard failed: ${existingDashRes.status}`);
    }
    const existingDashData = await existingDashRes.json();
    console.log("✓ Existing dashboard functional:", existingDashData);

    const existingCatsRes = await fetch(`${baseUrl}/api/categories`, {
      headers: authHeaders,
    });
    const existingCats = await existingCatsRes.json();
    console.log(`✓ Existing categories functional, count: ${existingCats.length}`);

    // 3. Create Stationery Item
    console.log("\n[TEST 3] Create stationery item...");
    const testItemName = `Test Ball Pen ${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/api/stationery/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: testItemName,
        category: "Writing Instruments",
        unit: "Piece",
        minimumStock: 5,
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.item?.id) {
      throw new Error(`Item creation failed: ${JSON.stringify(createData)}`);
    }
    const itemId = createData.item.id;
    console.log(`✓ Created item: ${createData.item.name} (ID: ${itemId}), currentStock: ${createData.item.currentStock}`);
    if (createData.item.currentStock !== 0) {
      throw new Error("New item should start with 0 stock");
    }

    // 4. Duplicate item rejection (case-insensitive)
    console.log("\n[TEST 4] Duplicate item rejection...");
    const dupRes = await fetch(`${baseUrl}/api/stationery/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: testItemName.toLowerCase(),
        category: "Writing Instruments",
        unit: "Piece",
        minimumStock: 5,
      }),
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 409 && dupRes.status !== 400) {
      throw new Error(`Duplicate item was not rejected: ${dupRes.status}`);
    }
    console.log("✓ Duplicate item rejected successfully:", dupData.message);

    // 4b. Invalid input validation
    console.log("\n[TEST 4b] Negative minimum stock validation...");
    const negRes = await fetch(`${baseUrl}/api/stationery/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: `Neg Item ${Date.now()}`,
        category: "General",
        unit: "Piece",
        minimumStock: -1,
      }),
    });
    if (negRes.status !== 400) {
      throw new Error(`Negative minimum stock was not rejected: ${negRes.status}`);
    }
    console.log("✓ Invalid minimum stock rejected with 400.");

    // 5 & 6. Receive Stock & Increase available stock
    console.log("\n[TEST 5 & 6] Receive stock from supplier...");
    const receiveQty = 25;
    const receiveRes = await fetch(`${baseUrl}/api/stationery/stock-in`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        itemId,
        supplierName: "Apex Stationery Suppliers",
        quantity: receiveQty,
        receivedDate: "2026-10-13",
        invoiceNumber: "INV-999",
        remarks: "First delivery batch",
      }),
    });
    const receiveData = await receiveRes.json();
    if (receiveRes.status !== 201) {
      throw new Error(`Receive stock failed: ${JSON.stringify(receiveData)}`);
    }
    console.log(`✓ Received ${receiveQty} units. Updated stock returned: ${receiveData.currentStock}`);
    if (receiveData.currentStock !== 25) {
      throw new Error(`Expected stock 25, got ${receiveData.currentStock}`);
    }

    // 7 & 8. Distribute item to student & Reduce available stock
    console.log("\n[TEST 7 & 8] Distribute items to student...");
    const issueQty = 5;
    const issueRes = await fetch(`${baseUrl}/api/stationery/distribute`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        itemId,
        quantity: issueQty,
        recipientName: "Rahul Sharma",
        recipientId: "STU-2026-101",
        recipientType: "Student",
        department: "Computer Science",
        reason: "Exam supplies",
        issuedBy: "Admin",
        issueDate: "2026-10-13",
        remarks: "Midterm test",
      }),
    });
    const issueData = await issueRes.json();
    if (issueRes.status !== 201) {
      throw new Error(`Distribution failed: ${JSON.stringify(issueData)}`);
    }
    console.log(`✓ Distributed ${issueQty} units. Updated stock returned: ${issueData.currentStock}`);
    if (issueData.currentStock !== 20) {
      throw new Error(`Expected remaining stock 20, got ${issueData.currentStock}`);
    }

    // 9. Reject distribution if stock insufficient without modifying stock
    console.log("\n[TEST 9] Insufficient stock rejection...");
    const overIssueQty = 50; // Only 20 available
    const overRes = await fetch(`${baseUrl}/api/stationery/distribute`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        itemId,
        quantity: overIssueQty,
        recipientName: "Pooja Verma",
        recipientId: "STU-2026-102",
        recipientType: "Student",
        department: "Physics",
        reason: "Lab class",
        issuedBy: "Admin",
        issueDate: "2026-10-13",
        remarks: "Excessive request",
      }),
    });
    const overData = await overRes.json();
    if (overRes.status !== 400) {
      throw new Error(`Over-distribution was not rejected: ${overRes.status}`);
    }
    console.log("✓ Insufficient stock correctly rejected:", overData.message);

    // Verify stock is still 20
    const checkItemsRes = await fetch(`${baseUrl}/api/stationery/items`, {
      headers: authHeaders,
    });
    const checkItems = await checkItemsRes.json();
    const verifiedItem = checkItems.find((i) => String(i.id) === String(itemId));
    if (verifiedItem.currentStock !== 20) {
      throw new Error(`Stock changed erroneously! Expected 20, got ${verifiedItem.currentStock}`);
    }
    console.log(`✓ Verified stock remained unchanged at ${verifiedItem.currentStock}`);

    // 10. Check Receipt and Distribution histories
    console.log("\n[TEST 10] Checking receipt and distribution history endpoints...");
    const receiptsRes = await fetch(`${baseUrl}/api/stationery/receipts`, {
      headers: authHeaders,
    });
    const receipts = await receiptsRes.json();
    const foundReceipt = receipts.find((r) => String(r.itemId) === String(itemId));
    if (!foundReceipt) {
      throw new Error("Recorded receipt not found in history!");
    }
    console.log(`✓ Receipt history verified (Receipt ID: ${foundReceipt.id}, Qty: ${foundReceipt.quantity})`);

    const distsRes = await fetch(`${baseUrl}/api/stationery/distributions`, {
      headers: authHeaders,
    });
    const dists = await distsRes.json();
    const foundDist = dists.find((d) => String(d.itemId) === String(itemId));
    if (!foundDist) {
      throw new Error("Recorded distribution not found in history!");
    }
    console.log(`✓ Distribution history verified (Dist ID: ${foundDist.id}, Qty: ${foundDist.quantity}, Recipient: ${foundDist.recipientName})`);

    // 11. Dashboard totals match item-level values
    console.log("\n[TEST 11] Stationery Dashboard totals consistency...");
    const dashRes = await fetch(`${baseUrl}/api/stationery/dashboard`, {
      headers: authHeaders,
    });
    const dashData = await dashRes.json();
    console.log("✓ Dashboard stats:", {
      totalItems: dashData.totalItems,
      totalReceived: dashData.totalReceived,
      totalDistributed: dashData.totalDistributed,
      totalAvailable: dashData.totalAvailable,
    });

    if (dashData.totalAvailable !== dashData.totalReceived - dashData.totalDistributed) {
      throw new Error(`Dashboard numbers mismatch: Available ${dashData.totalAvailable} !== Received ${dashData.totalReceived} - Distributed ${dashData.totalDistributed}`);
    }
    console.log("✓ Strict mathematical consistency confirmed: Available = Total Received - Total Distributed!");

    console.log("\n=========================================");
    console.log("ALL 11 AUTOMATED VERIFICATION TESTS PASSED!");
    console.log("=========================================\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
