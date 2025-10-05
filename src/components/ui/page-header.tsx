interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 relative inline-block">
            {title}
            <div className="absolute -bottom-1 left-0 h-1 w-16 bg-[#F15A24] rounded-full" />
          </h1>
          {description && (
            <p className="text-gray-600 text-sm sm:text-base mt-3">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom border decoration */}
      <div className="mt-6 h-px bg-gray-200 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-24 bg-[#F15A24] transition-all duration-500" />
      </div>
    </div>
  );
}
