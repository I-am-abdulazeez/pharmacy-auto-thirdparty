import { Card, CardBody } from "@heroui/card";

import { ArrowRightIcon } from "./icons";

interface PortalCardProps {
  title: string;
  onClick: () => void;
}

export default function PortalCard({ title, onClick }: PortalCardProps) {
  return (
    <Card
      isPressable
      className="group w-full cursor-pointer border border-gray-200 transition-all duration-300 hover:border-[#F15A24] hover:shadow-sm"
      shadow="none"
      onPress={onClick}
    >
      <CardBody className="p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-800">
            {title}
          </h3>
          <ArrowRightIcon />
        </div>
      </CardBody>
    </Card>
  );
}
