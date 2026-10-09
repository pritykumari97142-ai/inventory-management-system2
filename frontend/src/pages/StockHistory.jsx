import { useEffect, useState } from "react";
import api from "../services/api";

function StockHistory() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const transactionsPerPage = 5;

  const loadData = async () => {
    try {
      const [transactionResponse, productResponse] = await Promise.all([
        api.get("/transactions"),
        api.get("/products"),
      ]);

      setTransactions(transactionResponse.data);
      setProducts(productResponse.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductName = (productId) => {
    const product = products.find((item) => item.id == productId);

    return product?.name || "Unknown";
  };

  const filteredTransactions = transactions
    .slice()
    .reverse()
    .filter((transaction) => {
      const productName = getProductName(transaction.productId).toLowerCase();

      const matchesSearch = productName.includes(search.toLowerCase());

      const matchesType = typeFilter === "" || transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });

  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage,
  );

  const startIndex = (currentPage - 1) * transactionsPerPage;

  const currentTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + transactionsPerPage,
  );

  const changeSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const changeType = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Stock History</h2>
          <p>View all stock transactions</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Transaction History</h3>

            <p>
              Showing {currentTransactions.length} of{" "}
              {filteredTransactions.length} transactions
            </p>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />

            <select
              value={typeFilter}
              onChange={(e) => changeType(e.target.value)}
            >
              <option value="">All Transactions</option>

              <option value="IN">Stock IN</option>

              <option value="OUT">Stock OUT</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reference ID</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No transactions found
                  </td>
                </tr>
              ) : (
                currentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>

                    <td>
                      <strong>{getProductName(transaction.productId)}</strong>
                    </td>

                    <td>
                      {transaction.type === "IN" ? (
                        <span className="badge success">IN</span>
                      ) : (
                        <span className="badge danger">OUT</span>
                      )}
                    </td>

                    <td>{transaction.quantity}</td>

                    <td>{transaction.referenceId}</td>

                    <td>{transaction.date || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active-page" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockHistory;
