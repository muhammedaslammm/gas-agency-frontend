import { useState } from "react";
import { X } from "phosphor-react";
import { createProduct } from "./products.api";

const inputClasses =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100";

const labelClasses = "mb-1.5 block text-sm font-medium text-stone-700";

const initialFormData = {
  name: "",
  stockType: "cylinder",
  sellingPrice: "",
  filledQuantity: "0",
  emptyQuantity: "0",
  quantity: "0",
};

const ProductCreateModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = formData.name.trim();
    const sellingPrice = Number(formData.sellingPrice);

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (name.length > 100) {
      setError("Product name cannot exceed 100 characters.");
      return;
    }

    if (
      formData.sellingPrice.trim() === "" ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0 ||
      Math.round(sellingPrice * 100) !== sellingPrice * 100
    ) {
      setError("Enter a valid selling price with at most two decimal places.");
      return;
    }

    const quantityFields =
      formData.stockType === "cylinder"
        ? ["filledQuantity", "emptyQuantity"]
        : ["quantity"];

    for (const field of quantityFields) {
      const value = formData[field];

      if (
        value.trim() === "" ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) < 0
      ) {
        setError("Stock quantities must be valid non-negative integers.");
        return;
      }
    }

    const payload = {
      name,
      stockType: formData.stockType,
      sellingPrice,
      ...(formData.stockType === "cylinder"
        ? {
            filledQuantity: Number(formData.filledQuantity),
            emptyQuantity: Number(formData.emptyQuantity),
          }
        : {
            quantity: Number(formData.quantity),
          }),
    };

    setIsSubmitting(true);

    try {
      await createProduct(payload);

      onCreated();
      onClose();
    } catch (error) {
      setError(error.message || "Failed to create product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-product-title"
        className="w-full max-w-lg rounded-xl border border-stone-200 bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2
              id="create-product-title"
              className="text-lg font-semibold tracking-tight text-stone-900"
            >
              New Product
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Add a product and configure its opening stock.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-5">
            <div>
              <label htmlFor="product-name" className={labelClasses}>
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                id="product-name"
                name="name"
                type="text"
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. 14.2 kg Cylinder"
                className={inputClasses}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="product-stock-type" className={labelClasses}>
                Stock Type <span className="text-red-600">*</span>
              </label>
              <select
                id="product-stock-type"
                name="stockType"
                value={formData.stockType}
                onChange={handleChange}
                className={`${inputClasses} cursor-pointer`}
              >
                <option value="cylinder">Cylinder</option>
                <option value="other">Other Product</option>
              </select>
            </div>

            <div>
              <label htmlFor="product-selling-price" className={labelClasses}>
                Selling Price (₹) <span className="text-red-600">*</span>
              </label>
              <input
                id="product-selling-price"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClasses}
                required
              />
            </div>

            {formData.stockType === "cylinder" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="product-filled-quantity"
                    className={labelClasses}
                  >
                    Filled Cylinders
                  </label>
                  <input
                    id="product-filled-quantity"
                    name="filledQuantity"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.filledQuantity}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-empty-quantity"
                    className={labelClasses}
                  >
                    Empty Cylinders
                  </label>
                  <input
                    id="product-empty-quantity"
                    name="emptyQuantity"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.emptyQuantity}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="product-quantity" className={labelClasses}>
                  Opening Quantity
                </label>
                <input
                  id="product-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-stone-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreateModal;
