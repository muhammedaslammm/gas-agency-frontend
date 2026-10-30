import { Package } from "phosphor-react";

function ProductsTable({ products }) {
  function formatCurrency(amount) {
    return currencyFormatter.format(amount ?? 0);
  }

  function StockQuantity({ quantity }) {
    return (
      <span className="text-sm font-medium text-stone-800">
        {quantity ?? 0}
      </span>
    );
  }

  function ProductTypeBadge({ stockType }) {
    const isCylinder = stockType === "cylinder";

    return (
      <span
        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
          isCylinder
            ? "bg-stone-100 text-stone-700"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {isCylinder ? "Cylinder" : "Other"}
      </span>
    );
  }

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-stone-50">
          <tr className="border-b border-stone-200">
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Product
            </th>

            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Type
            </th>

            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
              Selling Price
            </th>

            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
              Filled Stock
            </th>

            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
              Empty Stock
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-stone-100">
          {products.map((product) => {
            const isCylinder = product.stockType === "cylinder";

            return (
              <tr
                key={product._id}
                className="transition-colors hover:bg-stone-50/70"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white">
                      <Package
                        size={20}
                        weight="regular"
                        className="text-stone-500"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {isCylinder
                          ? "Cylinder product"
                          : "Non-cylinder product"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <ProductTypeBadge stockType={product.stockType} />
                </td>

                <td className="px-5 py-4 text-right">
                  <span className="text-sm font-medium text-stone-900">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
                  <StockQuantity
                    quantity={
                      isCylinder ? product.filledQuantity : product.quantity
                    }
                  />
                </td>

                <td className="px-5 py-4 text-right">
                  {isCylinder ? (
                    <StockQuantity quantity={product.emptyQuantity} />
                  ) : (
                    <span className="text-sm text-stone-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductsTable;
