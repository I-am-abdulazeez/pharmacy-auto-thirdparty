export default function TextShowcase({
  showDescription = true,
}: {
  showDescription?: boolean;
}) {
  return (
    <div className="mb-7">
      <img
        alt="Logo"
        className="mx-auto h-16 mb-7 w-auto"
        src="/leadway-logo.png"
      />

      <h1 className="text-[18px] text-center font-bold text-[#1A1A1A]">
        Where genuine care meets{" "}
        <span className="text-[#f15A24]">unparalleled service.</span>
      </h1>
      {showDescription && (
        <p className="mt-3 text-sm lg:text-md font-medium text-center text-gray-600">
          Log in to request a prescription refill for an Enrollee
        </p>
      )}
    </div>
  );
}
