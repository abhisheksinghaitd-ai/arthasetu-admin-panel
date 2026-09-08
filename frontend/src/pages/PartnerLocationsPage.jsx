import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import StatCard from "../components/StatCard.jsx";
import { NA, locationChip } from "../lib/format.js";

const BTN_SECONDARY =
  "rounded border border-[var(--sage-line)] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]";

/* ---------------------------------------------------------------
   PartnerLocationsPage — latitude/longitude coverage for the
   distance-based Partner Router ranking. Props {partners, user}.
   Ported from legacy PartnerLocationsPage (lines ~1476-1502).
   --------------------------------------------------------------- */
export default function PartnerLocationsPage({ partners, user }) {
  const columns = [
    { key: "partner_id", label: "Partner ID" },
    { key: "partner_name", label: "Partner Name" },
    { key: "state", label: "State" },
    {
      key: "partner_location_latitude",
      label: "Latitude",
      render: (r) => r.partner_location_latitude ?? <NA label="Not Available" />,
    },
    {
      key: "partner_location_longitude",
      label: "Longitude",
      render: (r) => r.partner_location_longitude ?? <NA label="Not Available" />,
    },
    { key: "location_status", label: "Status", render: (r) => locationChip(r) },
    {
      key: "_source",
      label: "Location Source",
      render: (r) =>
        r.has_location ? "Verified upload" : <span className="text-[var(--slate)]">None on file</span>,
    },
    {
      key: "_verified",
      label: "Last Verified",
      render: (r) => (r.has_location ? r.as_of_date : <NA />),
    },
  ];

  const missing = partners.filter((p) => !p.has_location).length;

  return (
    <div>
      <PageHeader
        title="Partner Location Management"
        breadcrumb={["Partners", "Partner Locations"]}
        description="Verified coordinates are required for distance-based Partner Router ranking."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="TOTAL PARTNERS" value={partners.length} />
        <StatCard
          label="VERIFIED LOCATION"
          value={partners.length - missing}
          tone={missing < partners.length ? "accent" : "default"}
        />
        <StatCard label="MISSING LOCATION" value={missing} tone="warn" />
        <StatCard label="INVALID LOCATION" value={0} />
      </div>

      <div className="mb-5 rounded-md border border-[#E9D3A0] bg-[var(--amber-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
        Coordinates are never fabricated. {missing} of {partners.length} partners have no verified
        latitude/longitude in the source dataset and will show "Location Not Available" until an admin adds
        and verifies coordinates.
      </div>

      <DataTable
        columns={columns}
        rows={partners}
        rowKey="partner_id"
        title="partner locations"
        searchFields={["partner_id", "partner_name", "state"]}
        pageSize={12}
        extraToolbar={
          <button
            className={BTN_SECONDARY + " cursor-not-allowed opacity-60"}
            disabled
            title="Map view requires a mapping-library integration — not available in this build"
          >
            Map View
          </button>
        }
      />
    </div>
  );
}
