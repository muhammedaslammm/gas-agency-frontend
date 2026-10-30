import { ArrowSquareOut, MagnifyingGlass, Plus } from "phosphor-react";
import { useCallback, useEffect, useState } from "react";
import { getSales } from "./sales.api";
import SaleDetailsModal from "./SaleDetailsModal";
import CreateSaleModal from "./CreateSaleModal";

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

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateSaleModalOpen, setIsCreateSaleModalOpen] = useState(false);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getSales();

      if (!Array.isArray(data.sales)) {
        throw new Error("Invalid sales response from server.");
      }

      setSales(data.sales);
    } catch (error) {
      setError(error.message || "Unable to load sales.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredSales = sales.filter((sale) =>
    (sale.customerName || "").toLowerCase().includes(normalizedSearch),
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900">Sales</h1>
        <p className="text-sm text-gray-500">
          View and review your agency's recorded sales.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Search and actions */}
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
              placeholder="Search by customer name..."
              aria-label="Search sales by customer name"
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateSaleModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-black text-white cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            New sale
          </button>
        </div>

        {/* Sales table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-stone-50 text-gray-600">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Sale Date
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Customer
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Products Sold
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Empty Returns
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500 text-right">
                  Total
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading sales...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Sales could not be loaded.
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    {search.trim()
                      ? "No sales match your search."
                      : "No sales recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const items = Array.isArray(sale.items) ? sale.items : [];
                  const returns = Array.isArray(sale.emptyCylinderReturns)
                    ? sale.emptyCylinderReturns
                    : [];

                  const totalReturned = returns.reduce(
                    (total, item) => total + item.quantity,
                    0,
                  );

                  return (
                    <tr key={sale._id}>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(sale.saleDate)}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {sale.customerName || "Unknown customer"}
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

                      <td className="px-5 py-4 text-gray-600">
                        {totalReturned > 0
                          ? `${totalReturned} cylinder${totalReturned === 1 ? "" : "s"}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                            sale.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : sale.status === "reversed"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {sale.status || "Unknown"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
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

      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {isCreateSaleModalOpen && (
        <CreateSaleModal
          onClose={() => setIsCreateSaleModalOpen(false)}
          onCreated={loadSales}
        />
      )}
    </section>
  );
}

export default SalesPage;
