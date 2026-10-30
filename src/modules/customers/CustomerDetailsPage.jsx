import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CaretRight, MapPin, Phone, Wallet } from "phosphor-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0);
}

function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(`/customers/${id}`);
      const record = data?.customer ?? data;

      if (!record?._id) {
        throw new Error("Customer details were not returned by the server.");
      }

      setCustomer(record);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load customer details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-stone-500">
        Loading customer details...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft size={18} />
          Back to customers
        </button>

        <p className="text-sm text-red-700">{error || "Customer not found."}</p>

        <button
          type="button"
          onClick={loadCustomer}
          className="mt-4 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const routeName =
    typeof customer.route === "object" ? customer.route?.name : null;

  const cylinderBalances = customer.cylinderBalances ?? [];
  const productDiscounts = customer.productDiscounts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span
          onClick={() => navigate("/customers")}
          className="cursor-pointer hover:underline"
        >
          Customers
        </span>{" "}
        <CaretRight />{" "}
        <span className="text-neutral-400">Customer Details</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {customer.name || "Customer details"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Customer information and account balances
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Wallet size={21} className="text-stone-500" />
            <p className="text-sm text-stone-500">Outstanding Balance</p>
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-900">
            {formatCurrency(customer.balanceAmount)}
          </p>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Empty Cylinders Owed</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-900">
            {cylinderBalances.reduce(
              (total, entry) => total + (Number(entry.emptyCylindersOwed) || 0),
              0,
            )}
          </p>
        </section>
      </div>

      {/* Contact information */}
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Contact Information</h2>
        </div>

        <dl className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-stone-500">Customer Name</dt>
            <dd className="mt-1 font-medium text-stone-900">
              {customer.name || "—"}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-2 text-sm text-stone-500">
              <Phone size={16} />
              Phone
            </dt>
            <dd className="mt-1 font-medium text-stone-900">
              {customer.phone || "—"}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-2 text-sm text-stone-500">
              <MapPin size={16} />
              Address
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-stone-900">
              {customer.address || "—"}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-stone-500">Route</dt>
            <dd className="mt-1 font-medium text-stone-900">
              {routeName || "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Empty cylinder balances */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">
            Empty Cylinder Balances
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Empty cylinders the customer still owes, by product.
          </p>
        </div>

        {cylinderBalances.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">
            No cylinder balances recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Empty Cylinders Owed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {cylinderBalances.map((entry, index) => (
                  <tr key={entry.product?._id ?? index}>
                    <td className="px-5 py-4 text-stone-800">
                      {entry.product?.name || "Unavailable product"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-stone-800">
                      {Number(entry.emptyCylindersOwed) || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Product discounts */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Product Discounts</h2>
          <p className="mt-1 text-sm text-stone-500">
            Discounts configured for this customer.
          </p>
        </div>

        {productDiscounts.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">
            No customer-specific discounts configured.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Discount Per Unit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {productDiscounts.map((entry, index) => (
                  <tr key={entry.product?._id ?? index}>
                    <td className="px-5 py-4 text-stone-800">
                      {entry.product?.name || "Unavailable product"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-stone-800">
                      {formatCurrency(entry.discountAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerDetailsPage;
