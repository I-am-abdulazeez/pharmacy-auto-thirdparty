import { PropsWithChildren } from "react";

export default function CardContainer({ children }: PropsWithChildren) {
  return (
    <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-5 transition-all duration-500">
      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#F15A24] rounded-tl-2xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#F15A24] rounded-br-2xl opacity-50" />
      {children}
    </div>
  );
}
