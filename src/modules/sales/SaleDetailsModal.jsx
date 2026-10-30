import { ArrowULeftUp, ArrowUUpLeft } from "phosphor-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

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

function SaleDetailsModal({ sale, onClose }) {
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

  const items = Array.isArray(sale.items) ? sale.items : [];
  const returns = Array.isArray(sale.emptyCylinderReturns)
    ? sale.emptyCylinderReturns
    : [];

  const totalReturned = returns.reduce(
    (total, item) => total + item.quantity,
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
        aria-labelledby="sale-details-title"
        className="flex max-h-[90vh] text-sm w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2
              id="sale-details-title"
              className="text-xl font-semibold text-gray-900"
            >
              Sale Details
            </h2>

            <p className="text-sm text-gray-500">{formatDate(sale.saleDate)}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sale details"
            className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            &times;
          </button>
        </header>

        <div className="flex flex-col gap-8 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">
                {sale.customerName || "Unknown customer"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Sale date</p>
              <p className="font-medium text-gray-900">
                {formatDate(sale.saleDate)}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Status</p>
              <span
                className={`inline-flex rounded-[.5rem] px-2.5 py-1 text-xs font-medium capitalize ${
                  sale.status === "completed"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {sale.status || "Unknown"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-gray-900">Products Sold</h3>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-stone-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Standard Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Discount/Unit
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Selling Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={`${item.product}-${index}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.standardUnitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.discountPerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-gray-900">
              Empty Cylinders Returned
            </h3>

            {returns.length === 0 ? (
              <p className="rounded-lg border border-gray-200 px-4 py-5 text-sm text-gray-500">
                No empty cylinders were returned for this sale.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Quantity Returned
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {returns.map((item, index) => (
                      <tr key={`${item.product}-${index}`}>
                        <td className="px-4 py-3 text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="bg-stone-50">
                    <tr>
                      <td className="px-4 py-3 font-medium">Total returned</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {totalReturned}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-5">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Sale Amount</p>
              <p className="text-lg font-medium text-gray-900">
                {formatCurrency(sale.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <footer className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-800 cursor-pointer"
          >
            <ArrowUUpLeft weight="bold" /> Close
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

export default SaleDetailsModal;
