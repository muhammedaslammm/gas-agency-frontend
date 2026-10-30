import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash,
  X,
  UserCircle,
  Package,
  ArrowUUpLeft,
  CurrencyInr,
  User,
} from "phosphor-react";

import {
  createSale,
  getCustomerForSale,
  getCustomersForSale,
  getProductsForSale,
} from "./sales.api";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id : value;
};

const getLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const createEmptyItem = () => ({
  productId: "",
  quantity: "1",
});

const createEmptyReturn = () => ({
  productId: "",
  quantity: "1",
});

export default function CreateSaleModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [items, setItems] = useState([createEmptyItem()]);
  const [emptyReturns, setEmptyReturns] = useState([]);

  const [routeValue, setRouteValue] = useState("direct");
  const [saleDate, setSaleDate] = useState(getLocalDateTime());
  const [paymentReceived, setPaymentReceived] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load customer names and products when the modal opens.
  useEffect(() => {
    let active = true;

    const loadFormData = async () => {
      setInitialLoading(true);
      setError("");

      try {
        const [customerResponse, productResponse] = await Promise.all([
          getCustomersForSale(),
          getProductsForSale(),
        ]);

        if (!active) return;

        setCustomers(customerResponse.customers ?? []);
        setProducts(productResponse.products ?? []);
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load sale form data.");
        }
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    loadFormData();

    return () => {
      active = false;
    };
  }, []);

  // Close with Escape and lock background scrolling.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, submitting]);

  // Fetch full details only when a customer is selected.
  useEffect(() => {
    let active = true;

    if (!customerId) {
      setCustomer(null);
      setCustomerLoading(false);
      setRouteValue("direct");
      setEmptyReturns([]);
      return () => {
        active = false;
      };
    }

    const loadCustomer = async () => {
      setCustomerLoading(true);
      setCustomer(null);
      setEmptyReturns([]);
      setError("");

      try {
        const response = await getCustomerForSale(customerId);

        if (!active) return;

        const selectedCustomer = response.customer;
        setCustomer(selectedCustomer);

        const customerRouteId = getId(selectedCustomer.route);
        setRouteValue(customerRouteId || "direct");
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load customer details.");
          setCustomer(null);
          setRouteValue("direct");
        }
      } finally {
        if (active) setCustomerLoading(false);
      }
    };

    loadCustomer();

    return () => {
      active = false;
    };
  }, [customerId]);

  const discountsByProduct = useMemo(() => {
    const discounts = new Map();

    for (const entry of customer?.productDiscounts ?? []) {
      const productId = getId(entry.product);
      if (productId) {
        discounts.set(productId, Number(entry.discountAmount) || 0);
      }
    }

    return discounts;
  }, [customer]);

  const emptyBalancesByProduct = useMemo(() => {
    const balances = new Map();

    for (const entry of customer?.cylinderBalances ?? []) {
      const productId = getId(entry.product);
      if (productId) {
        balances.set(productId, Number(entry.emptyCylindersOwed) || 0);
      }
    }

    return balances;
  }, [customer]);

  const saleItems = useMemo(() => {
    return items.map((item) => {
      const product = products.find((entry) => entry._id === item.productId);

      const standardUnitPrice = Number(product?.sellingPrice) || 0;
      const discountPerUnit = product
        ? (discountsByProduct.get(product._id) ?? 0)
        : 0;

      const unitPrice =
        Math.round((standardUnitPrice - discountPerUnit) * 100) / 100;

      const quantity = Number(item.quantity) || 0;

      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

      const availableQuantity = product
        ? product.stockType === "cylinder"
          ? Number(product.filledQuantity) || 0
          : Number(product.quantity) || 0
        : 0;

      return {
        ...item,
        product,
        standardUnitPrice,
        discountPerUnit,
        unitPrice,
        lineTotal,
        availableQuantity,
      };
    });
  }, [items, products, discountsByProduct]);

  const totalAmount = useMemo(
    () =>
      Math.round(
        saleItems.reduce((total, item) => total + item.lineTotal, 0) * 100,
      ) / 100,
    [saleItems],
  );

  const paymentAmount = Number(paymentReceived) || 0;
  const previousBalance = Number(customer?.balanceAmount) || 0;

  const resultingBalance =
    Math.round((previousBalance + totalAmount - paymentAmount) * 100) / 100;

  const cylinderProducts = useMemo(
    () => products.filter((product) => product.stockType === "cylinder"),
    [products],
  );

  const addItem = () => {
    setItems((current) => [...current, createEmptyItem()]);
  };

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === "productId" ? { quantity: "1" } : {}),
            }
          : item,
      ),
    );
  };

  const removeItem = (index) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  const addReturn = () => {
    setEmptyReturns((current) => [...current, createEmptyReturn()]);
  };

  const updateReturn = (index, field, value) => {
    setEmptyReturns((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === "productId" ? { quantity: "1" } : {}),
            }
          : item,
      ),
    );
  };

  const removeReturn = (index) => {
    setEmptyReturns((current) => current.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!customerId || !customer) {
      return "Select a customer.";
    }

    if (customerLoading) {
      return "Please wait for customer details to load.";
    }

    if (!saleItems.length || saleItems.some((item) => !item.productId)) {
      return "Select a product for every sale item.";
    }

    const selectedProductIds = saleItems.map((item) => item.productId);

    if (new Set(selectedProductIds).size !== selectedProductIds.length) {
      return "Each product can only appear once. Update its quantity instead.";
    }

    for (const item of saleItems) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return "Sale quantities must be whole numbers greater than zero.";
      }

      if (!item.product) {
        return "One or more selected products are unavailable.";
      }

      if (item.discountPerUnit > item.standardUnitPrice) {
        return `The discount configured for "${item.product.name}" exceeds its selling price.`;
      }

      if (quantity > item.availableQuantity) {
        return `Insufficient available stock for "${item.product.name}".`;
      }
    }

    const validReturns = emptyReturns.filter((item) => item.productId);

    if (validReturns.length !== emptyReturns.length) {
      return "Select a product for every empty-cylinder return.";
    }

    const returnProductIds = validReturns.map((item) => item.productId);

    if (new Set(returnProductIds).size !== returnProductIds.length) {
      return "Each product can only appear once in empty-cylinder returns.";
    }

    for (const item of validReturns) {
      const quantity = Number(item.quantity);
      const owed = emptyBalancesByProduct.get(item.productId) ?? 0;

      if (!Number.isInteger(quantity) || quantity < 1) {
        return "Empty-cylinder return quantities must be whole numbers greater than zero.";
      }

      if (quantity > owed) {
        const product = products.find((entry) => entry._id === item.productId);

        return `The customer only owes ${owed} empty "${product?.name ?? "cylinder"}" cylinders.`;
      }
    }

    if (!saleDate || Number.isNaN(new Date(saleDate).getTime())) {
      return "Enter a valid sale date.";
    }

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount < 0 ||
      Math.round(paymentAmount * 100) !== paymentAmount * 100
    ) {
      return "Enter a valid payment amount with at most two decimal places.";
    }

    if (paymentAmount > previousBalance + totalAmount) {
      return "Payment cannot exceed the customer's total outstanding balance after this sale.";
    }

    if (paymentAmount > 0 && !paymentMethod) {
      return "Select a payment method.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      customerId,
      route: routeValue,
      items: saleItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      emptyCylinderReturns: emptyReturns
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      paymentReceived: paymentAmount,
      saleDate: new Date(saleDate).toISOString(),
    };

    if (paymentAmount > 0) {
      payload.paymentMethod = paymentMethod;
    }

    setSubmitting(true);

    try {
      await createSale(payload);
      await onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not record this sale.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-sale-title"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-stone-200 p-4">
          <div>
            <h2
              id="create-sale-title"
              className="text-lg font-semibold text-stone-900"
            >
              Create Sale
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Record products sold, empty cylinders returned, and payment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {initialLoading ? (
              <div className="py-16 text-center text-sm text-stone-500">
                Loading customers and products...
              </div>
            ) : (
              <>
                {/* Customer and route */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <User
                      size={16}
                      weight={"bold"}
                      className="text-stone-500"
                    />
                    <h3 className="font-medium text-stone-800">
                      Customer & Route
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sale-customer" className={labelClass}>
                        Customer <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="sale-customer"
                        value={customerId}
                        onChange={(event) => {
                          setCustomerId(event.target.value);
                          setError("");
                        }}
                        className={inputClass}
                        required
                      >
                        <option value="">Select a customer</option>
                        {customers.map((entry) => (
                          <option key={entry._id} value={entry._id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>

                      {customerLoading && (
                        <p className="mt-1.5 text-xs text-stone-500">
                          Loading customer details...
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="sale-route" className={labelClass}>
                        Sale route <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="sale-route"
                        value={routeValue}
                        onChange={(event) => setRouteValue(event.target.value)}
                        className={inputClass}
                        disabled={!customer || customerLoading}
                      >
                        <option value="direct">Direct</option>

                        {customer?.route?._id && (
                          <option value={customer.route._id}>
                            {customer.route.name}
                          </option>
                        )}
                      </select>

                      <p className="mt-1.5 text-xs text-stone-500">
                        Defaults to the customer's route when available.
                      </p>
                    </div>
                  </div>

                  {customer && !customerLoading && (
                    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                        Current outstanding balance
                      </p>
                      <p className="mt-1 text-xl font-semibold text-stone-900">
                        {formatCurrency(customer.balanceAmount)}
                      </p>
                    </div>
                  )}
                </section>

                {/* Sale items */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Package
                        size={16}
                        weight={"bold"}
                        className="text-stone-500"
                      />
                      <h3 className="font-medium text-stone-800">
                        Products sold
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!customer || customerLoading}
                      className={`${buttonClass} border border-stone-300 bg-white text-stone-700 hover:bg-stone-50`}
                    >
                      <Plus size={16} />
                      Add product
                    </button>
                  </div>

                  <div className="space-y-3">
                    {saleItems.map((item, index) => {
                      const selectedIds = items
                        .filter((_, itemIndex) => itemIndex !== index)
                        .map((entry) => entry.productId);

                      return (
                        <div
                          key={`sale-item-${index}`}
                          className="rounded-lg border border-stone-200 p-4"
                        >
                          <div className="grid gap-3 sm:grid-cols-12 sm:items-start">
                            <div className="sm:col-span-5">
                              <label
                                htmlFor={`sale-product-${index}`}
                                className={labelClass}
                              >
                                Product
                              </label>

                              <select
                                id={`sale-product-${index}`}
                                value={item.productId}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "productId",
                                    event.target.value,
                                  )
                                }
                                className={inputClass}
                                required
                                disabled={!customer || customerLoading}
                              >
                                <option value="">Select product</option>
                                {products.map((product) => (
                                  <option
                                    key={product._id}
                                    value={product._id}
                                    disabled={selectedIds.includes(product._id)}
                                  >
                                    {product.name}
                                  </option>
                                ))}
                              </select>

                              {item.product && (
                                <p className="mt-1.5 text-xs text-stone-500">
                                  Available stock: {item.availableQuantity}
                                </p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <label
                                htmlFor={`sale-quantity-${index}`}
                                className={labelClass}
                              >
                                Quantity
                              </label>

                              <input
                                id={`sale-quantity-${index}`}
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                className={inputClass}
                                required
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <p className={labelClass}>Line total</p>
                              <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-900">
                                {formatCurrency(item.lineTotal)}
                              </p>
                            </div>

                            <div className="sm:col-span-1 sm:text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                disabled={items.length === 1}
                                title="Remove product"
                                aria-label={`Remove product row ${index + 1}`}
                                className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </div>

                          {item.product && (
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-stone-100 pt-3 text-xs text-stone-600">
                              <span>
                                Standard price:{" "}
                                <strong className="font-medium text-stone-800">
                                  {formatCurrency(item.standardUnitPrice)}
                                </strong>
                              </span>

                              <span>
                                Customer discount:{" "}
                                <strong className="font-medium text-stone-800">
                                  {formatCurrency(item.discountPerUnit)}
                                </strong>
                              </span>

                              <span>
                                Final unit price:{" "}
                                <strong className="font-semibold text-stone-900">
                                  {formatCurrency(item.unitPrice)}
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
                    <span className="text-sm font-medium text-stone-700 uppercase">
                      Sale total
                    </span>
                    <span className="text-lg font-semibold text-stone-900">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </section>

                {/* Empty-cylinder returns */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ArrowUUpLeft
                        size={16}
                        weight={"bold"}
                        className="text-stone-500"
                      />
                      <div>
                        <h3 className="font-semibold text-stone-800">
                          Empty cylinders returned
                        </h3>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Optional. Only return cylinders the customer owes.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addReturn}
                      disabled={
                        !customer ||
                        customerLoading ||
                        cylinderProducts.length === 0
                      }
                      className={`${buttonClass} border border-stone-300 bg-white text-stone-700 hover:bg-stone-50`}
                    >
                      <Plus size={16} />
                      Add return
                    </button>
                  </div>

                  {emptyReturns.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-500">
                      No empty-cylinder returns added.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emptyReturns.map((item, index) => {
                        const selectedIds = emptyReturns
                          .filter((_, returnIndex) => returnIndex !== index)
                          .map((entry) => entry.productId);

                        const owed = item.productId
                          ? (emptyBalancesByProduct.get(item.productId) ?? 0)
                          : 0;

                        return (
                          <div
                            key={`empty-return-${index}`}
                            className="grid gap-3 rounded-lg border border-stone-200 p-4 sm:grid-cols-12 sm:items-end"
                          >
                            <div className="sm:col-span-6">
                              <label
                                htmlFor={`return-product-${index}`}
                                className={labelClass}
                              >
                                Cylinder product
                              </label>

                              <select
                                id={`return-product-${index}`}
                                value={item.productId}
                                onChange={(event) =>
                                  updateReturn(
                                    index,
                                    "productId",
                                    event.target.value,
                                  )
                                }
                                className={inputClass}
                                required
                                disabled={!customer || customerLoading}
                              >
                                <option value="">Select cylinder</option>

                                {cylinderProducts.map((product) => {
                                  const customerOwes =
                                    emptyBalancesByProduct.get(product._id) ??
                                    0;

                                  return (
                                    <option
                                      key={product._id}
                                      value={product._id}
                                      disabled={
                                        selectedIds.includes(product._id) ||
                                        customerOwes <= 0
                                      }
                                    >
                                      {product.name} — owes {customerOwes}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div className="sm:col-span-4">
                              <label
                                htmlFor={`return-quantity-${index}`}
                                className={labelClass}
                              >
                                Quantity returned
                              </label>

                              <input
                                id={`return-quantity-${index}`}
                                type="number"
                                min="1"
                                max={owed || undefined}
                                step="1"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateReturn(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                className={inputClass}
                                required
                              />

                              {item.productId && (
                                <p className="mt-1 text-xs text-stone-500">
                                  Customer currently owes: {owed}
                                </p>
                              )}
                            </div>

                            <div className="sm:col-span-2 sm:text-right">
                              <button
                                type="button"
                                onClick={() => removeReturn(index)}
                                aria-label={`Remove empty return row ${index + 1}`}
                                className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Payment */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CurrencyInr
                      size={16}
                      weight={"bold"}
                      className="text-stone-500"
                    />
                    <h3 className="font-medium text-stone-800">Payment</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sale-payment" className={labelClass}>
                        Payment received
                      </label>

                      <input
                        id="sale-payment"
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentReceived}
                        onChange={(event) =>
                          setPaymentReceived(event.target.value)
                        }
                        className={inputClass}
                      />

                      <p className="mt-1.5 text-xs text-stone-500">
                        Can include payment toward the customer's previous
                        outstanding balance.
                      </p>
                    </div>

                    {paymentAmount > 0 && (
                      <div>
                        <label
                          htmlFor="sale-payment-method"
                          className={labelClass}
                        >
                          Payment method
                        </label>

                        <select
                          id="sale-payment-method"
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                          className={inputClass}
                          required
                        >
                          <option value="cash">Cash</option>
                          <option value="bank-transfer">Bank transfer</option>
                          <option value="upi">UPI</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-lg border border-stone-200">
                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-sm">
                      <span className="text-stone-600">
                        Previous outstanding
                      </span>
                      <span className="font-medium text-stone-800">
                        {formatCurrency(previousBalance)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-sm">
                      <span className="text-stone-600">Sale total</span>
                      <span className="font-medium text-stone-800">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-sm">
                      <span className="text-stone-600">Payment received</span>
                      <span className="font-medium text-stone-800">
                        − {formatCurrency(paymentAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 bg-stone-50 px-4 py-4">
                      <span className="text-sm font-medium uppercase text-stone-800">
                        Outstanding after sale
                      </span>
                      <span className="text-lg font-semibold text-stone-900">
                        {formatCurrency(resultingBalance)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Sale date */}
                <section>
                  <label htmlFor="sale-date" className={labelClass}>
                    Sale date
                  </label>

                  <input
                    id="sale-date"
                    type="datetime-local"
                    value={saleDate}
                    onChange={(event) => setSaleDate(event.target.value)}
                    className={`${inputClass} sm:max-w-sm`}
                    required
                  />
                </section>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`${buttonClass} border border-stone-300 bg-white text-stone-700 hover:bg-stone-50`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                initialLoading || customerLoading || !customer || submitting
              }
              className={`${buttonClass} bg-stone-800 text-white hover:bg-stone-700`}
            >
              {submitting ? "Recording sale..." : "Record sale"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
