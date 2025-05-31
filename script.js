let db;

document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("receiptDB", 1);
  request.onerror = () => alert("Database failed to open");
  request.onsuccess = () => {
    db = request.result;
    displayReceipts();
  };
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("receipts", { keyPath: "id", autoIncrement: true });
  };

  document.getElementById("receiptForm").onsubmit = saveReceipt;
  document
    .getElementById("filterDate")
    .addEventListener("change", displayReceipts);
  document
    .getElementById("filterFolder")
    .addEventListener("change", displayReceipts);
});

function saveReceipt(e) {
  e.preventDefault();
  const date = document.getElementById("receiptDate").value;
  const notes = document.getElementById("receiptNotes").value;
  const folder = document.getElementById("receiptFolder").value;
  const file = document.getElementById("receiptImage").files[0];

  if (!file || !folder) return;

  const reader = new FileReader();
  reader.onload = () => {
    const receipt = { date, notes, folder, image: reader.result };
    const tx = db.transaction(["receipts"], "readwrite");
    tx.objectStore("receipts").add(receipt);
    tx.oncomplete = () => {
      document.getElementById("receiptForm").reset();
      displayReceipts();
    };
  };
  reader.readAsDataURL(file);
}

function displayReceipts() {
  const list = document.getElementById("receiptList");
  list.innerHTML = "";
  const filterDate = document.getElementById("filterDate").value;
  const filterFolder = document.getElementById("filterFolder").value;

  const tx = db.transaction("receipts", "readonly");
  const store = tx.objectStore("receipts");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const { id, date, notes, folder, image } = cursor.value;
      const matchDate = !filterDate || filterDate === date;
      const matchFolder = !filterFolder || filterFolder === folder;

      if (matchDate && matchFolder) {
        const col = document.createElement("div");
        col.className = "col-6 col-md-4 mb-3";
        col.innerHTML = `
          <div class="card">
            <img src="${image}" class="card-img-top" alt="Receipt">
            <div class="card-body">
              <p class="fw-bold">${new Date(date).toDateString()}</p>
              <p><strong>Store:</strong> ${folder}</p>
              <p>${notes || ""}</p>
              <button class="btn btn-danger btn-sm" onclick="deleteReceipt(${id})">Delete</button>
            </div>
          </div>`;
        list.appendChild(col);
      }
      cursor.continue();
    }
  };
}

function deleteReceipt(id) {
  const tx = db.transaction("receipts", "readwrite");
  const store = tx.objectStore("receipts");
  store.delete(id);
  tx.oncomplete = () => displayReceipts();
}

function exportCSV() {
  const tx = db.transaction("receipts", "readonly");
  const store = tx.objectStore("receipts");
  const rows = [["Date", "Store", "Notes"]];

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const { date, notes, folder } = cursor.value;
      rows.push([date, folder, notes || ""]);
      cursor.continue();
    } else {
      const csvContent = rows.map((e) => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "receipts.csv";
      link.click();
    }
  };
}
