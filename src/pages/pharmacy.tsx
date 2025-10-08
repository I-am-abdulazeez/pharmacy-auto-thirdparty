import { Input } from "@heroui/input";

import SelectStates from "@/components/select-state";
import PharmacyDataTable from "@/components/pharmacy-table";
import { useEnrolleeSearch } from "@/lib/hooks/use-enrollee-search";
import PageHeader from "@/components/ui/page-header";

export default function PharmacyPage() {
  const { searchCriteria, handleChange, handleBlur, validation } =
    useEnrolleeSearch();

  return (
    <>
      <PageHeader
        description="Manage and view pharmacy information for enrollees"
        title="Pharmacy"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Input
          errorMessage={validation.enrolleeId.errorMessage}
          isDisabled={false}
          isInvalid={validation.enrolleeId.isInvalid}
          label="Enrollee ID"
          name="enrolleeId"
          placeholder="Enter Enrollee ID (e.g. 2400135/0)"
          radius="sm"
          value={searchCriteria.enrolleeId}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        <SelectStates />
      </div>
      <PharmacyDataTable />
    </>
  );
}
