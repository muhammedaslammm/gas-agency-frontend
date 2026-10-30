import { useCallback, useEffect, useState } from "react";
import { ArrowSquareOut, MagnifyingGlass, Plus } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { getStockPurchases } from "./purchases.api";
import StockPurchaseDetailsModal from "./PurchaseDetailsModal";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getItemsSummary = (items = []) => {
  if (!items.length) return "No items";

  const visibleItems = items
    .slice(0, 2)
    .map((item) => `${item.productName} × ${item.quantity}`);

  const remainingCount = items.length - visibleItems.length;

  if (remainingCount > 0) {
    visibleItems.push(`+${remainingCount} more`);
  }

  return visibleItems.join(", ");
};

function PurchasePage() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadPurchases = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getStockPurchases();

      if (!Array.isArray(data.purchases)) {
        throw new Error("Invalid stock purchases response from server.");
      }

      setPurchases(data.purchases);
    } catch (error) {
      setError(error.message || "Unable to load stock purchases.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredPurchases = purchases.filter((purchase) =>
    (purchase.supplierName || "").toLowerCase().includes(normalizedSearch),
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-stone-900">Stock</h1>
        <p className="text-sm text-stone-500">
          View and review your agency's recorded stock purchases.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Search and purchase count */}
        <div className="flex gap-3 border-b border-stone-200 p-4 items-center justify-between">
          <div className="relative w-full lg:max-w-sm">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by supplier name..."
              aria-label="Search stock purchases by supplier name"
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-black text-white cursor-pointer"
            onClick={() => navigate("/purchases/new")}
          >
            <Plus size={15} weight="bold" /> Add Purchase
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadPurchases}
              disabled={isLoading}
              className="cursor-pointer self-start text-sm font-medium text-red-700 underline disabled:opacity-60 sm:self-auto"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stock purchases table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-stone-50 text-gray-600">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Purchase Date
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Invoice Number
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Supplier
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Items Purchased
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
                  EMR
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Total Bill
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Loading stock purchases...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Stock purchases could not be loaded.
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    {search.trim()
                      ? "No purchases match your search."
                      : "No stock purchases recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const items = Array.isArray(purchase.items)
                    ? purchase.items
                    : [];

                  return (
                    <tr key={purchase._id}>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(purchase.purchaseDate)}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {purchase.invoiceNumber || "—"}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {purchase.supplierName || "Unknown supplier"}
                      </td>

                      <td
                        className="max-w-64 px-5 py-4 text-gray-600"
                        title={items
                          .map(
                            (item) => `${item.productName} × ${item.quantity}`,
                          )
                          .join(", ")}
                      >
                        {getItemsSummary(items)}
                      </td>

                      <td className="px-5 py-4 text-center text-gray-600">
                        {purchase.emr ? "Yes" : "No"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(purchase.totalBillPrice)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPurchase(purchase)}
                          className="ml-auto flex cursor-pointer items-center justify-end gap-1 text-sm text-stone-700 hover:text-stone-900"
                        >
                          <ArrowSquareOut size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPurchase && (
        <StockPurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </section>
  );
}

export default PurchasePage;
