import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRight, FloppyDisk, Plus, Trash } from "phosphor-react";

import {
  createPurchase,
  getProductsforPurchase,
  getSuppliersforPurchase,
} from "./purchases.api";

const inputClasses =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100";

const labelClasses = "mb-1.5 block text-sm font-medium text-stone-700";

const sectionClasses = "rounded-xl border border-stone-200 bg-white";

const formatAmount = (value) =>
  Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createEmptyItem = (id) => ({
  id,
  productId: "",
  quantity: "1",
  totalGstPrice: "",
});

const PurchaseCreatePage = () => {
  const navigate = useNavigate();

  const nextRowId = useRef(2);
  const productSelectRefs = useRef({});
  const pendingFocusRowId = useRef(null);

  const [form, setForm] = useState({
    invoiceNumber: "",
    supplierId: "",
    purchaseDate: getLocalDate(),
    emr: false,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([createEmptyItem(1)]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadFormData = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [suppliersResponse, productsResponse] = await Promise.all([
          getSuppliersforPurchase(),
          getProductsforPurchase(),
        ]);

        if (!isActive) return;

        setSuppliers(suppliersResponse.suppliers ?? []);
        setProducts(productsResponse.products ?? []);
      } catch (error) {
        if (isActive) {
          setLoadError(
            error.message || "Failed to load suppliers and products.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadFormData();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  // Focus the newly added row's product selector.
  useEffect(() => {
    const rowId = pendingFocusRowId.current;

    if (rowId === null) return;

    productSelectRefs.current[rowId]?.focus();
    pendingFocusRowId.current = null;
  }, [items]);

  const selectedProductIds = new Set(
    items.map((item) => item.productId).filter(Boolean),
  );

  const billTotal = items.reduce((total, item) => {
    const amount = Number(item.totalGstPrice);

    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleItemChange = (rowId, field, value) => {
    setItems((current) =>
      current.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddItem = () => {
    const newId = nextRowId.current++;

    pendingFocusRowId.current = newId;
    setItems((current) => [...current, createEmptyItem(newId)]);
  };

  const handleRemoveItem = (rowId) => {
    setItems((current) => current.filter((item) => item.id !== rowId));

    delete productSelectRefs.current[rowId];
  };

  const handlePriceKeyDown = (event, rowIndex) => {
    if (event.key !== "Enter") return;

    // Enter adds a row instead of submitting the form.
    event.preventDefault();

    if (rowIndex === items.length - 1) {
      handleAddItem();
    } else {
      productSelectRefs.current[items[rowIndex + 1].id]?.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const invoiceNumber = form.invoiceNumber.trim();

    if (!invoiceNumber) {
      setSubmitError("Invoice number is required.");
      return;
    }

    if (invoiceNumber.length > 100) {
      setSubmitError("Invoice number cannot exceed 100 characters.");
      return;
    }

    if (!form.supplierId) {
      setSubmitError("Please select a supplier.");
      return;
    }

    if (items.length === 0) {
      setSubmitError("Add at least one product to the purchase.");
      return;
    }

    const productIds = new Set();
    const purchaseItems = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const rowNumber = index + 1;

      if (!item.productId) {
        setSubmitError(`Please select a product in row ${rowNumber}.`);
        return;
      }

      if (productIds.has(item.productId)) {
        setSubmitError("A product cannot be added more than once.");
        return;
      }

      productIds.add(item.productId);

      const quantity = Number(item.quantity);
      const totalGstPrice = Number(item.totalGstPrice);

      if (
        item.quantity.trim() === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      ) {
        setSubmitError(
          `Enter a valid positive whole-number quantity in row ${rowNumber}.`,
        );
        return;
      }

      if (
        item.totalGstPrice.trim() === "" ||
        !Number.isFinite(totalGstPrice) ||
        totalGstPrice < 0 ||
        Math.round(totalGstPrice * 100) / 100 !== totalGstPrice
      ) {
        setSubmitError(
          `Enter a valid total GST-inclusive price in row ${rowNumber}.`,
        );
        return;
      }

      purchaseItems.push({
        productId: item.productId,
        quantity,
        totalGstPrice,
      });
    }

    const payload = {
      invoiceNumber,
      supplierId: form.supplierId,
      purchaseDate: form.purchaseDate || undefined,
      emr: form.emr,
      items: purchaseItems,
    };

    setIsSubmitting(true);

    try {
      const response = await createPurchase(payload);

      navigate("/purchases", {
        state: {
          successMessage: response.message || "Purchase recorded successfully.",
        },
      });
    } catch (error) {
      setSubmitError(error.message || "Failed to record purchase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-sm">
          <span
            onClick={() => navigate("/purchases")}
            className="cursor-pointer text-stone-600 hover:text-stone-900 hover:underline"
          >
            Purchases
          </span>
          <CaretRight className="text-stone-400" />
          <span className="text-stone-400">New Purchase</span>
        </div>

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            New Purchase
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Record a stock purchase and update your inventory.
          </p>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-2 cursor-pointer font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      {isLoading ? (
        <div className={`${sectionClasses} p-6 text-sm text-stone-500`}>
          Loading suppliers and products...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={isSubmitting} className="space-y-5">
            {/* Purchase information */}
            <section className={`${sectionClasses} p-5`}>
              <h2 className="text-base font-semibold text-stone-900">
                Purchase Information
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Enter the supplier and invoice details.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="purchase-supplier" className={labelClasses}>
                    Supplier <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="purchase-supplier"
                    name="supplierId"
                    required
                    value={form.supplierId}
                    onChange={handleFormChange}
                    className={inputClasses}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-700">
                      No active suppliers available.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="purchase-invoice" className={labelClasses}>
                    Invoice Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="purchase-invoice"
                    name="invoiceNumber"
                    type="text"
                    required
                    maxLength={100}
                    value={form.invoiceNumber}
                    onChange={handleFormChange}
                    placeholder="Enter invoice number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="purchase-date" className={labelClasses}>
                    Purchase Date
                  </label>
                  <input
                    id="purchase-date"
                    name="purchaseDate"
                    type="date"
                    value={form.purchaseDate}
                    onChange={handleFormChange}
                    className={inputClasses}
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="emr"
                      checked={form.emr}
                      onChange={handleFormChange}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-stone-900"
                    />
                    <span>
                      <span className="block text-sm font-medium text-stone-800">
                        EMR
                      </span>
                      <span className="mt-0.5 block text-xs text-stone-500">
                        Do not deduct empty-cylinder stock.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Purchase items */}
            <section className={`${sectionClasses} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    Purchase Items
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Enter the quantity and total GST-inclusive price for each
                    product.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={products.length === 0}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add item
                </button>
              </div>

              {products.length === 0 ? (
                <div className="border-t border-stone-100 px-5 py-8 text-center text-sm text-stone-500">
                  No active products available. Add a product before recording a
                  purchase.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] table-fixed">
                      <thead className="bg-stone-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                          <th className="w-[42%] px-5 py-3.5">Product</th>
                          <th className="w-[17%] px-3 py-3.5">Quantity</th>
                          <th className="w-[25%] px-3 py-3.5">
                            Total GST Price (₹)
                          </th>
                          <th className="w-[16%] px-5 py-3.5 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-stone-100">
                        {items.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-5 py-3">
                              <select
                                ref={(element) => {
                                  productSelectRefs.current[item.id] = element;
                                }}
                                aria-label={`Product for row ${index + 1}`}
                                value={item.productId}
                                onChange={(event) =>
                                  handleItemChange(
                                    item.id,
                                    "productId",
                                    event.target.value,
                                  )
                                }
                                className={inputClasses}
                              >
                                <option value="">Select product</option>
                                {products.map((product) => {
                                  const selectedInAnotherRow =
                                    selectedProductIds.has(product._id) &&
                                    item.productId !== product._id;

                                  return (
                                    <option
                                      key={product._id}
                                      value={product._id}
                                      disabled={selectedInAnotherRow}
                                    >
                                      {product.name}
                                      {product.stockType === "cylinder"
                                        ? " (Cylinder)"
                                        : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                aria-label={`Quantity for row ${index + 1}`}
                                value={item.quantity}
                                onChange={(event) =>
                                  handleItemChange(
                                    item.id,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                className={`${inputClasses} text-right`}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                aria-label={`Total GST-inclusive price for row ${index + 1}`}
                                placeholder="0.00"
                                value={item.totalGstPrice}
                                onChange={(event) =>
                                  handleItemChange(
                                    item.id,
                                    "totalGstPrice",
                                    event.target.value,
                                  )
                                }
                                onKeyDown={(event) =>
                                  handlePriceKeyDown(event, index)
                                }
                                className={`${inputClasses} text-right`}
                              />
                            </td>

                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                aria-label={`Remove row ${index + 1}`}
                                title="Remove item"
                                className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash size={17} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-stone-100 px-5 py-3">
                    <p className="text-xs text-stone-500">
                      Tip: Press Enter in the price field to add the next
                      product row. Use Tab to move between fields.
                    </p>
                  </div>
                </>
              )}
            </section>
          </fieldset>

          {/* Total and actions */}
          <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-stone-500">Total Bill Amount</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                ₹{formatAmount(billTotal)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate("/purchases")}
                className="cursor-pointer rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isLoading ||
                  Boolean(loadError) ||
                  suppliers.length === 0 ||
                  products.length === 0
                }
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FloppyDisk size={16} />
                {isSubmitting ? "Recording..." : "Record Purchase"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PurchaseCreatePage;
