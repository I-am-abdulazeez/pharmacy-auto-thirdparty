import { Input } from "@heroui/input";

import PageHeader from "@/components/ui/page-header";
import { useEnrolleeSearch } from "@/lib/hooks/use-enrollee-search";
import EnrolleeDataTable from "@/components/enrollee-table";

export default function EnrolleesPage() {
  const { searchCriteria, handleChange, handleBlur, validation } =
    useEnrolleeSearch();

  return (
    <>
      <PageHeader
        description="Manage and view enrollee information"
        title="Enrollees"
      />

      <section>
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

          <Input
            errorMessage={validation.firstName.errorMessage}
            isDisabled={false}
            isInvalid={validation.firstName.isInvalid}
            label="First Name"
            name="firstName"
            placeholder="Enter first name"
            radius="sm"
            value={searchCriteria.firstName}
            onBlur={handleBlur}
            onChange={handleChange}
          />

          <Input
            errorMessage={validation.lastName.errorMessage}
            isDisabled={false}
            isInvalid={validation.lastName.isInvalid}
            label="Last Name"
            name="lastName"
            placeholder="Enter last name"
            radius="sm"
            value={searchCriteria.lastName}
            onBlur={handleBlur}
            onChange={handleChange}
          />

          <Input
            errorMessage={validation.mobileNo.errorMessage}
            isDisabled={false}
            isInvalid={validation.mobileNo.isInvalid}
            label="Mobile Number"
            name="mobileNo"
            placeholder="Enter mobile number"
            radius="sm"
            value={searchCriteria.mobileNo}
            onBlur={handleBlur}
            onChange={handleChange}
          />

          <Input
            errorMessage={validation.email.errorMessage}
            isDisabled={false}
            isInvalid={validation.email.isInvalid}
            label="Email"
            name="email"
            placeholder="Enter email address"
            radius="sm"
            type="email"
            value={searchCriteria.email}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        </div>
        <EnrolleeDataTable />
      </section>
    </>
  );
}
