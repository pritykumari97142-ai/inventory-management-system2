const app = require("./app");
const http = require("http");

async function verifyBallPenWorkflow() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server running at ${baseUrl}`);

  try {
    console.log("\n=======================================================");
    console.log("TESTING WORKFLOW: add Ball Pen → receive 20 → distribute 3 → verify 17");
    console.log("=======================================================\n");

    // 1. Authenticate / Login
    console.log("[STEP 1] Logging in as Admin...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "admin123" }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    console.log("✓ Logged in successfully.");

    // Ensure clean slate for 'Ball Pen' before running the workflow test
    const fs = require("fs");
    const path = require("path");
    const dbPath = path.join(__dirname, "data/db.json");
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      const existingBallPen = db.stationeryItems?.find((i) => i.name.toLowerCase() === "ball pen");
      if (existingBallPen) {
        db.stationeryItems = db.stationeryItems.filter((i) => i.id !== existingBallPen.id);
        db.stockReceipts = (db.stockReceipts || []).filter((r) => r.itemId !== existingBallPen.id);
        db.itemDistributions = (db.itemDistributions || []).filter((d) => d.itemId !== existingBallPen.id);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
      }
    }

    // 2. Add Stationery Item: Ball Pen
    console.log("\n[STEP 2] Adding item 'Ball Pen'...");
    const addRes = await fetch(`${baseUrl}/api/stationery/items`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Ball Pen",
        category: "Writing Instruments",
        unit: "Piece",
        minimumStock: 5,
      }),
    });
    const addData = await addRes.json();
    console.log(`Add Item Response [${addRes.status}]:`, addData);
    if (addRes.status !== 201 || !addData.item) {
      throw new Error(`Failed to add item: ${JSON.stringify(addData)}`);
    }
    const ballPenId = addData.item.id;
    console.log(`✓ Ball Pen created with ID: ${ballPenId}, initial stock: ${addData.item.currentStock}`);
    if (addData.item.currentStock !== 0) {
      throw new Error(`Expected initial stock 0, got ${addData.item.currentStock}`);
    }

    // 2b. Verify duplicate rejection
    console.log("\n[STEP 2b] Verifying duplicate rejection for 'ball pen'...");
    const dupRes = await fetch(`${baseUrl}/api/stationery/items`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "ball pen",
        category: "Writing Instruments",
        unit: "Piece",
        minimumStock: 5,
      }),
    });
    const dupData = await dupRes.json();
    console.log(`Duplicate response [${dupRes.status}]:`, dupData);
    if (dupRes.status !== 409 && dupRes.status !== 400) {
      throw new Error(`Duplicate was not rejected: ${dupRes.status}`);
    }
    console.log("✓ Duplicate name correctly rejected.");

    // 3. Receive 20 units of Ball Pen
    console.log("\n[STEP 3] Receiving 20 Ball Pens from 'ABC Stationery Store'...");
    const recRes = await fetch(`${baseUrl}/api/stationery/stock-in`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        itemId: ballPenId,
        supplierName: "ABC Stationery Store",
        quantity: 20,
        receivedDate: "2026-10-13",
        invoiceNumber: "INV-2026-001",
        remarks: "Initial consignment of ball pens",
      }),
    });
    const recData = await recRes.json();
    console.log(`Stock Received Response [${recRes.status}]:`, recData);
    if (recRes.status !== 201) {
      throw new Error(`Failed to receive stock: ${JSON.stringify(recData)}`);
    }
    if (recData.currentStock !== 20) {
      throw new Error(`Expected current stock 20, got ${recData.currentStock}`);
    }
    console.log(`✓ Stock successfully increased from 0 to 20! Current Stock: ${recData.currentStock}`);

    // Verify via GET items
    const getItems1 = await (await fetch(`${baseUrl}/api/stationery/items`, { headers })).json();
    const itemAfterRec = getItems1.find((i) => i.id === ballPenId);
    if (itemAfterRec.currentStock !== 20) {
      throw new Error(`Expected item currentStock 20, got ${itemAfterRec.currentStock}`);
    }
    console.log(`✓ Verified via GET /api/stationery/items: Stock = ${itemAfterRec.currentStock}`);

    // 4. Distribute 3 units of Ball Pen
    console.log("\n[STEP 4] Distributing 3 Ball Pens to student 'Rahul Sharma'...");
    const distRes = await fetch(`${baseUrl}/api/stationery/distribute`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        itemId: ballPenId,
        quantity: 3,
        recipientName: "Rahul Sharma",
        recipientId: "STU-2026-101",
        recipientType: "Student",
        department: "Computer Science",
        reason: "Mid-term examination",
        issuedBy: "Admin",
        issueDate: "2026-10-13",
        remarks: "Requisition #01",
      }),
    });
    const distData = await distRes.json();
    console.log(`Distribution Response [${distRes.status}]:`, distData);
    if (distRes.status !== 201) {
      throw new Error(`Failed to distribute item: ${JSON.stringify(distData)}`);
    }
    if (distData.currentStock !== 17) {
      throw new Error(`Expected remaining stock 17, got ${distData.currentStock}`);
    }
    console.log(`✓ Stock successfully decreased from 20 to 17! Remaining Stock: ${distData.currentStock}`);

    // 5. Test Insufficient Stock Rejection
    console.log("\n[STEP 5] Testing rejection of distribution exceeding available stock (attempting to issue 25 when 17 available)...");
    const overRes = await fetch(`${baseUrl}/api/stationery/distribute`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        itemId: ballPenId,
        quantity: 25,
        recipientName: "Pooja Verma",
        recipientId: "STU-102",
        recipientType: "Student",
        reason: "Over requisition",
        issueDate: "2026-10-13",
      }),
    });
    const overData = await overRes.json();
    console.log(`Over-distribution Response [${overRes.status}]:`, overData);
    if (overRes.status !== 400) {
      throw new Error(`Over-distribution was not rejected with 400: ${overRes.status}`);
    }
    console.log("✓ Insufficient stock correctly rejected without modifying inventory.");

    // 6. Verify item stock is still 17
    console.log("\n[STEP 6] Verifying item stock remains exactly 17...");
    const getItems2 = await (await fetch(`${baseUrl}/api/stationery/items`, { headers })).json();
    const itemAfterOver = getItems2.find((i) => i.id === ballPenId);
    if (itemAfterOver.currentStock !== 17) {
      throw new Error(`Expected stock 17, got ${itemAfterOver.currentStock}`);
    }
    console.log(`✓ Confirmed item current stock is 17.`);

    // 7. Verify Receipt History
    console.log("\n[STEP 7] Verifying receipt history...");
    const recHist = await (await fetch(`${baseUrl}/api/stationery/receipts`, { headers })).json();
    const foundRec = recHist.find((r) => r.itemId === ballPenId);
    if (!foundRec || foundRec.quantity !== 20) {
      throw new Error(`Receipt history incorrect: ${JSON.stringify(recHist)}`);
    }
    console.log(`✓ Receipt history shows: ${foundRec.quantity} units received from ${foundRec.supplierName}`);

    // 8. Verify Distribution History
    console.log("\n[STEP 8] Verifying distribution history...");
    const distHist = await (await fetch(`${baseUrl}/api/stationery/distributions`, { headers })).json();
    const foundDist = distHist.find((d) => d.itemId === ballPenId);
    if (!foundDist || foundDist.quantity !== 3) {
      throw new Error(`Distribution history incorrect: ${JSON.stringify(distHist)}`);
    }
    console.log(`✓ Distribution history shows: ${foundDist.quantity} units issued to ${foundDist.recipientName}`);

    // 9. Verify Stationery Dashboard Stats
    console.log("\n[STEP 9] Verifying Stationery Dashboard statistics...");
    const dash = await (await fetch(`${baseUrl}/api/stationery/dashboard`, { headers })).json();
    console.log("Dashboard response:", {
      totalItems: dash.totalItems,
      totalReceived: dash.totalReceived,
      totalDistributed: dash.totalDistributed,
      totalAvailable: dash.totalAvailable,
    });
    if (dash.totalAvailable !== dash.totalReceived - dash.totalDistributed) {
      throw new Error(`Total available mismatch: ${dash.totalAvailable} !== ${dash.totalReceived} - ${dash.totalDistributed}`);
    }
    const ballPenInDash = dash.items.find((i) => i.id === ballPenId);
    if (!ballPenInDash || ballPenInDash.currentStock !== 17) {
      throw new Error(`Ball Pen in dashboard has incorrect stock: ${ballPenInDash?.currentStock}`);
    }
    console.log(`✓ Ball Pen verified on Dashboard: currentStock = ${ballPenInDash.currentStock}!`);
    console.log("✓ Strict equality holds: Total Available = Total Received - Total Distributed!");

    // 10. Verify unauthenticated call still succeeds gracefully via stationeryAuth
    console.log("\n[STEP 10] Testing call without Authorization header (stationeryAuth fallback)...");
    const unauthDash = await (await fetch(`${baseUrl}/api/stationery/dashboard`)).json();
    if (unauthDash.totalAvailable !== dash.totalAvailable) {
      throw new Error(`stationeryAuth fallback failed: ${JSON.stringify(unauthDash)}`);
    }
    console.log(`✓ StationeryAuth fallback works seamlessly: returned totalAvailable = ${unauthDash.totalAvailable}!`);

    console.log("\n=======================================================");
    console.log("✓ ALL STEPS IN WORKFLOW VERIFIED SUCCESSFULLY!");
    console.log("=======================================================\n");
  } finally {
    server.close();
  }
}

verifyBallPenWorkflow().catch((err) => {
  console.error("Workflow verification failed:", err);
  process.exit(1);
});
