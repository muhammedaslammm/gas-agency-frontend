import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowClockwise,
  CaretRight,
  MagnifyingGlass,
  Plus,
  Users,
  Wallet,
} from "phosphor-react";
import { apiRequest } from "../../services/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0);
}

function getEmptyCylinderTotal(customer) {
  return (customer.cylinderBalances ?? []).reduce((total, entry) => {
    return total + (Number(entry.emptyCylindersOwed) || 0);
  }, 0);
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Unable to load customers. Please try again.";
}

function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/customers");

      if (!Array.isArray(data?.customers)) {
        throw new Error("The server returned an invalid customers response.");
      }

      setCustomers(data.customers);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce(
      (total, customer) => total + (Number(customer.balanceAmount) || 0),
      0,
    );
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) => {
      const name = customer.name ?? "";
      const phone = customer.phone ?? "";

      return (
        name.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query)
      );
    });
  }, [customers, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          Customers
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage customer details, outstanding balances, and cylinder returns.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
              <Users size={21} className="text-stone-600" />
            </div>
            <p className="text-sm font-medium text-stone-500">
              Total Customers
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold tabular-nums text-stone-900">
            {loading ? "—" : customers.length.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
              <Wallet size={21} className="text-stone-600" />
            </div>
            <p className="text-sm font-medium text-stone-500">
              Total Outstanding
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold tabular-nums text-stone-900">
            {loading ? "—" : formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Customer table */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex gap-3 border-b border-stone-200 p-4 items-center justify-between">
          <div className="flex gap-2">
            <label className="relative w-full max-w-sm">
              <MagnifyingGlass
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or phone"
                aria-label="Search customers by name or phone"
                className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
              />
            </label>

            <button
              type="button"
              onClick={loadCustomers}
              disabled={loading}
              aria-label="Refresh customers"
              title="Refresh customers"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 px-3 text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowClockwise size={18} />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-black text-white cursor-pointer"
            onClick={() => navigate("/customers/new")}
          >
            <Plus size={15} weight="bold" />
            New Customer
          </button>
        </div>

        {error ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadCustomers}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-stone-500">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-stone-800">
              {search ? "No matching customers" : "No customers yet"}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {search
                ? "Try a different name or phone number."
                : "Customers will appear here once they have been added."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Route
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Outstanding
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Empty Cylinders Owed
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Address
                  </th>
                  <th scope="col" className="w-10 px-3 py-3">
                    <span className="sr-only">View details</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map((customer) => {
                  const outstanding = Number(customer.balanceAmount) || 0;
                  const routeName =
                    typeof customer.route === "object"
                      ? customer.route?.name
                      : null;

                  return (
                    <tr
                      key={customer._id}
                      tabIndex={0}
                      onClick={() => navigate(`/customers/${customer._id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/customers/${customer._id}`);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-900">
                          {customer.name || "Unnamed customer"}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">
                          {customer.phone || "No phone number"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-stone-600">
                        {routeName || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span
                          className={
                            outstanding > 0
                              ? "font-medium text-stone-900"
                              : "text-stone-500"
                          }
                        >
                          {formatCurrency(outstanding)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-stone-700">
                        {getEmptyCylinderTotal(customer).toLocaleString(
                          "en-IN",
                        )}
                      </td>

                      <td
                        className="max-w-64 truncate px-5 py-4 text-stone-500"
                        title={customer.address || ""}
                      >
                        {customer.address || "—"}
                      </td>

                      <td className="px-3 py-4 text-stone-400">
                        <CaretRight size={18} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomersPage;
