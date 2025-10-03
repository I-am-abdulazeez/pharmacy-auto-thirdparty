import { Card, CardBody } from "@heroui/card";

interface PortalCardProps {
  title: string;
  onClick: () => void;
}

export default function PortalCard({ title, onClick }: PortalCardProps) {
  return (
    <Card
      isPressable
      className="w-full cursor-pointer border-1 border-gray-100 hover:shadow transition-all duration-200 hover:border-[#b54477]"
      shadow="none"
      onPress={onClick}
    >
      <CardBody className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#1A1A1A] truncate">
              {title}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <div className="w-6 h-6 text-[#b54477] flex items-center justify-center">
              →
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
