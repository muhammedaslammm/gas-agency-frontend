import { useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlass,
  Package,
  ArrowClockwise,
  WarningCircle,
  Plus,
} from "phosphor-react";
import ProductsTable from "./ProductsTable.jsx";
import ProductCreateModal from "./ProductCreateModal.jsx";
import { getProducts } from "./products.api.js";

const filters = [
  { label: "All Products", value: "all" },
  { label: "Cylinders", value: "cylinder" },
  { label: "Other Products", value: "other" },
];

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getProducts();
      setProducts(response.products ?? []);
    } catch (err) {
      setError(err.message || "Unable to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesType =
        activeFilter === "all" || product.stockType === activeFilter;

      return matchesSearch && matchesType;
    });
  }, [products, searchTerm, activeFilter]);

  const filterCounts = useMemo(
    () => ({
      all: products.length,
      cylinder: products.filter((product) => product.stockType === "cylinder")
        .length,
      other: products.filter((product) => product.stockType === "other").length,
    }),
    [products],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Products
          </h1>

          <p className="text-sm text-stone-500">
            Manage your products, selling prices, and available stock.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProducts}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <ArrowClockwise
            size={17}
            className={isLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Product list */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {/* Search and filters */}
        <div className="space-y-4 border-b border-stone-200 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <MagnifyingGlass
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products by name"
                className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = activeFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-stone-900 text-white"
                        : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                  >
                    {filter.label}

                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {filterCounts[filter.value]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div>
              <button
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors border border-neutral-300 bg-white text-black cursor-pointer hover:bg-stone-50"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus /> Create Product
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-12"
            role="status"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" />

            <p className="text-sm text-stone-500">Loading products...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <WarningCircle size={32} className="text-red-500" />

            <h2 className="mt-3 text-sm font-semibold text-stone-900">
              Could not load products
            </h2>

            <p className="mt-1 max-w-sm text-sm text-stone-500">{error}</p>

            <button
              type="button"
              onClick={loadProducts}
              className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty and filtered states */}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100">
              <Package size={24} className="text-stone-500" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-stone-900">
              {products.length === 0
                ? "No products yet"
                : "No matching products"}
            </h2>

            <p className="mt-1 max-w-sm text-sm text-stone-500">
              {products.length === 0
                ? "Your products will appear here once they have been added."
                : "Try a different search term or select another product type."}
            </p>

            {products.length > 0 && (searchTerm || activeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
                className="mt-3 text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-900"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Products table */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <ProductsTable products={filteredProducts} />
        )}

        {/* Footer */}
        {!isLoading && !error && products.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50/50 px-5 py-3">
            <p className="text-xs text-stone-500">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}
      </section>
      {isCreateModalOpen && (
        <ProductCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={loadProducts}
        />
      )}
    </div>
  );
}

export default ProductsPage;
