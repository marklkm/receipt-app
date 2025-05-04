let db;

window.onload = () => {
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
};

function saveReceipt(e) {
  e.preventDefault();
  const date = document.getElementById("receiptDate").value;
  const file = document.getElementById("receiptImage").files[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const receipt = { date, image: reader.result };
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

  const tx = db.transaction("receipts", "readonly");
  const store = tx.objectStore("receipts");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const { date, image } = cursor.value;
      const col = document.createElement("div");
      col.className = "col-6 col-md-4";
      col.innerHTML = `
        <div class="card">
          <img src="${image}" class="card-img-top" alt="Receipt">
          <div class="card-body">
            <p class="card-text">${new Date(date).toDateString()}</p>
          </div>
        </div>`;
      list.appendChild(col);
      cursor.continue();
    }
  };
}
