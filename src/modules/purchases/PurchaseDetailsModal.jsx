import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowUUpLeft } from "phosphor-react";

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

function PurchaseDetailsModal({ purchase, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const items = Array.isArray(purchase.items) ? purchase.items : [];

  const totalEmptyReturned = items.reduce(
    (total, item) => total + (item.emptyQuantityReturned ?? 0),
    0,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-purchase-details-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white text-sm shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-stone-200 p-5">
          <div>
            <h2
              id="stock-purchase-details-title"
              className="text-xl font-semibold text-stone-900"
            >
              Purchase Details
            </h2>
            <p className="text-sm text-stone-500">
              {formatDate(purchase.purchaseDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close purchase details"
            className="cursor-pointer rounded-lg px-3 py-1 text-2xl text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            &times;
          </button>
        </header>

        <div className="flex flex-col gap-8 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-stone-500">Supplier</p>
              <p className="font-medium text-stone-900">
                {purchase.supplierName || "Unknown supplier"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-stone-500">Purchase Date</p>
              <p className="font-medium text-stone-900">
                {formatDate(purchase.purchaseDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-stone-900">Purchased Items</h3>

            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Line Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-stone-500"
                      >
                        No items recorded for this purchase.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={`${item.product}-${index}`}>
                        <td className="px-4 py-3 font-medium text-stone-900">
                          {item.productName || "Unknown product"}
                        </td>

                        <td className="px-4 py-3 text-right text-stone-600">
                          {item.quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-stone-600">
                          {formatCurrency(item.unitCost)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-900">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-stone-900">
              Empty Cylinders Returned to Supplier
            </h3>

            {items.some((item) => item.stockType === "cylinder") ? (
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Quantity Returned
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {items
                      .filter((item) => item.stockType === "cylinder")
                      .map((item, index) => (
                        <tr key={`${item.product}-${index}`}>
                          <td className="px-4 py-3 text-stone-900">
                            {item.productName || "Unknown product"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-stone-700">
                            {item.emptyQuantityReturned ?? 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>

                  <tfoot className="bg-stone-50">
                    <tr>
                      <td className="px-4 py-3 font-medium">Total returned</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {totalEmptyReturned}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-stone-200 px-4 py-5 text-sm text-stone-500">
                No cylinder products were included in this purchase.
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-stone-200 pt-5">
            <div className="text-right">
              <p className="text-sm text-stone-500">Total Purchase Cost</p>
              <p className="text-lg font-medium text-stone-900">
                {formatCurrency(purchase.totalCost)}
              </p>
            </div>
          </div>
        </div>

        <footer className="flex justify-end border-t border-stone-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            <ArrowUUpLeft weight="bold" />
            Close
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

export default PurchaseDetailsModal;
