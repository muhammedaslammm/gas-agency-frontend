import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CaretRight, FloppyDisk } from "phosphor-react";

import { createCustomer } from "./customers.api";
import { getRoutes } from "../routes/routes.api";
import { getProductsforCustomers } from "../products/products.api";

const inputClasses =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100";

const labelClasses = "mb-1.5 block text-sm font-medium text-stone-700";

const sectionClasses = "rounded-xl border border-stone-200 bg-white";

const formatAmount = (value) =>
  Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CustomerCreatePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    routeId: "",
    balanceAmount: "0",
  });

  const [routes, setRoutes] = useState([]);
  const [products, setProducts] = useState([]);
  const [cylinderBalances, setCylinderBalances] = useState({});
  const [productDiscounts, setProductDiscounts] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadFormData = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [routesResponse, productsResponse] = await Promise.all([
          getRoutes(),
          getProductsforCustomers(),
        ]);

        if (!isActive) return;

        setRoutes(routesResponse.routes ?? []);
        setProducts(productsResponse.products ?? []);
      } catch (error) {
        if (isActive) {
          setLoadError(error.message || "Failed to load routes and products.");
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
  }, []);

  const cylinderProducts = products.filter(
    (product) => product.stockType === "cylinder",
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCylinderBalanceChange = (productId, value) => {
    setCylinderBalances((current) => ({
      ...current,
      [productId]: value,
    }));
  };

  const handleDiscountToggle = (productId, enabled) => {
    setProductDiscounts((current) => ({
      ...current,
      [productId]: {
        enabled,
        discountAmount: current[productId]?.discountAmount ?? "",
      },
    }));
  };

  const handleDiscountAmountChange = (productId, value) => {
    setProductDiscounts((current) => ({
      ...current,
      [productId]: {
        enabled: true,
        discountAmount: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const trimmedName = form.name.trim();
    const balanceAmount = Number(form.balanceAmount);

    if (!trimmedName) {
      setSubmitError("Customer name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setSubmitError("Customer name cannot exceed 100 characters.");
      return;
    }

    if (form.address.trim().length > 500 || form.phone.trim().length > 20) {
      setSubmitError("Address or phone number exceeds the allowed length.");
      return;
    }

    if (
      form.balanceAmount.trim() === "" ||
      !Number.isFinite(balanceAmount) ||
      balanceAmount < 0 ||
      Math.round(balanceAmount * 100) / 100 !== balanceAmount
    ) {
      setSubmitError(
        "Opening balance must be a non-negative amount with up to two decimal places.",
      );
      return;
    }

    const cylinderBalanceEntries = [];

    for (const product of cylinderProducts) {
      const rawValue = cylinderBalances[product._id] ?? "0";
      const quantity = Number(rawValue);

      if (
        rawValue.trim() === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 0
      ) {
        setSubmitError(
          `Enter a valid non-negative whole number for ${product.name}.`,
        );
        return;
      }

      // Zero balances do not need to be stored.
      if (quantity > 0) {
        cylinderBalanceEntries.push({
          productId: product._id,
          emptyCylindersOwed: quantity,
        });
      }
    }

    const discountEntries = [];

    for (const product of products) {
      const discount = productDiscounts[product._id];

      if (!discount?.enabled) continue;

      const rawAmount = discount.discountAmount;
      const discountAmount = Number(rawAmount);

      if (
        rawAmount.trim() === "" ||
        !Number.isFinite(discountAmount) ||
        discountAmount < 0 ||
        Math.round(discountAmount * 100) / 100 !== discountAmount
      ) {
        setSubmitError(`Enter a valid discount amount for ${product.name}.`);
        return;
      }

      discountEntries.push({
        productId: product._id,
        discountAmount,
      });
    }

    const customerData = {
      name: trimmedName,
      address: form.address.trim(),
      phone: form.phone.trim(),
      routeId: form.routeId || null,
      balanceAmount,
      cylinderBalances: cylinderBalanceEntries,
      productDiscounts: discountEntries,
    };

    setIsSubmitting(true);

    try {
      const response = await createCustomer(customerData);

      navigate("/customers", {
        state: {
          successMessage: response.message || "Customer created successfully.",
        },
      });
    } catch (error) {
      setSubmitError(error.message || "Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span
            onClick={() => navigate("/customers")}
            className="cursor-pointer hover:underline"
          >
            Customers
          </span>{" "}
          <CaretRight /> <span className="text-neutral-400">New Customer</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            New Customer
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Add a customer and configure their opening balances and discounts.
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
            onClick={() => window.location.reload()}
            className="mt-2 font-medium underline"
          >
            Reload page
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
          Loading routes and products...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={isSubmitting}>
            <section className={`${sectionClasses} p-5`}>
              <h2 className="text-base font-semibold text-stone-900">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Enter the customer's contact details and delivery route.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="customer-name" className={labelClasses}>
                    Customer Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="customer-name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customer-phone" className={labelClasses}>
                    Phone Number
                  </label>
                  <input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    maxLength={20}
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="customer-route" className={labelClasses}>
                    Route
                  </label>
                  <select
                    id="customer-route"
                    name="routeId"
                    value={form.routeId}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option value="">No route assigned</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="customer-balance" className={labelClasses}>
                    Opening Outstanding Balance (₹)
                  </label>
                  <input
                    id="customer-balance"
                    name="balanceAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.balanceAmount}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                  <p className="mt-1.5 text-xs text-stone-500">
                    Amount the customer currently owes the agency.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="customer-address" className={labelClasses}>
                    Address
                  </label>
                  <textarea
                    id="customer-address"
                    name="address"
                    rows={3}
                    maxLength={500}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter customer address"
                    className={inputClasses}
                  />
                </div>
              </div>
            </section>

            <section className={`${sectionClasses} mt-5 p-5`}>
              <h2 className="text-base font-semibold text-stone-900">
                Empty Cylinder Balances
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Record how many empty cylinders the customer currently owes the
                agency.
              </p>

              {cylinderProducts.length === 0 ? (
                <p className="mt-5 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-500">
                  No active cylinder products are available.
                </p>
              ) : (
                <div className="mt-5 divide-y divide-stone-100">
                  {cylinderProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <label
                        htmlFor={`cylinder-${product._id}`}
                        className="text-sm font-medium text-stone-800"
                      >
                        {product.name}
                      </label>

                      <input
                        id={`cylinder-${product._id}`}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={cylinderBalances[product._id] ?? "0"}
                        onChange={(event) =>
                          handleCylinderBalanceChange(
                            product._id,
                            event.target.value,
                          )
                        }
                        className={`${inputClasses} max-w-32 text-right`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`${sectionClasses} mt-5 p-5`}>
              <h2 className="text-base font-semibold text-stone-900">
                Product Discounts
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Configure an optional per-unit discount for individual products.
                Leave products unchecked to use their standard selling price.
              </p>

              {products.length === 0 ? (
                <p className="mt-5 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-500">
                  No active products are available.
                </p>
              ) : (
                <div className="mt-5 divide-y divide-stone-100">
                  {products.map((product) => {
                    const discount = productDiscounts[product._id];
                    const enabled = Boolean(discount?.enabled);

                    return (
                      <div
                        key={product._id}
                        className="flex items-center justify-between gap-5 py-3 first:pt-0 last:pb-0"
                      >
                        <label className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) =>
                              handleDiscountToggle(
                                product._id,
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                          />
                          <span className="text-sm font-medium text-stone-800">
                            {product.name}
                          </span>
                        </label>

                        <div className="w-40 shrink-0">
                          <label
                            htmlFor={`discount-${product._id}`}
                            className="sr-only"
                          >
                            Discount amount for {product.name}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                              ₹
                            </span>
                            <input
                              id={`discount-${product._id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!enabled}
                              value={discount?.discountAmount ?? ""}
                              onChange={(event) =>
                                handleDiscountAmountChange(
                                  product._id,
                                  event.target.value,
                                )
                              }
                              placeholder="0.00"
                              className={`${inputClasses} pl-7 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </fieldset>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate("/customers")}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isLoading || Boolean(loadError)}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <FloppyDisk size={16} />
              {isSubmitting ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CustomerCreatePage;
