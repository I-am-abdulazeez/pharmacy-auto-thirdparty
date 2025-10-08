import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

interface InactivityModalProps {
  isOpen: boolean;
  countdown: number;
  onStayActive: () => void;
  onLogout: () => void;
}

export const InactivityModal = ({
  isOpen,
  countdown,
  onStayActive,
  onLogout,
}: InactivityModalProps) => {
  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      isDismissable={false}
      isOpen={isOpen}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h4 className="text-xl font-semibold text-warning">
                Session Timeout Warning
              </h4>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-3">
                <p className="text-default-600">
                  You have been inactive for a while. For security reasons, your
                  session will expire soon.
                </p>
                <div className="flex items-center justify-center bg-danger/10 rounded-lg p-3">
                  <span className="text-danger font-bold text-lg">
                    Session expires in: {countdown} seconds
                  </span>
                </div>
                <p className="text-sm text-default-500">
                  {` Click "Stay Active" to continue your session or "Logout" to
                  end it now.`}
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onLogout}>
                Logout
              </Button>
              <Button color="primary" onPress={onStayActive}>
                Stay Active
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
