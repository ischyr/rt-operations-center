import { Box, Flex, Text, Button, IconButton } from '@chakra-ui/react';
import { Modal, ModalOverlay, ModalContent, ModalBody } from '@chakra-ui/react';
import { CloseIcon, WarningTwoIcon } from '@chakra-ui/icons';

const RED = '#FC8181';

/**
 * Themed delete confirmation modal — replaces the browser's window.confirm.
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void   (Cancel)
 *   onConfirm – () => void  (Delete)
 *   title    – string       e.g. "Delete Engagement"
 *   itemName – string       e.g. "Operation Electric Vortex"
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = 'Confirm Delete', itemName }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(6px)" />
      <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden" p={0}>
        <ModalBody p={0}>
          <Box p={6} pos="relative">
            {/* Red gradient line */}
            <Box pos="absolute" top="0" left="0" right="0" h="2px"
              style={{ background: `linear-gradient(to right, transparent, ${RED}90, transparent)` }} />

            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={5}>
              <Flex align="center" gap={3}>
                <Flex w="38px" h="38px" borderRadius="10px" align="center" justify="center"
                  bg={`${RED}15`} border={`1px solid ${RED}35`} flexShrink={0}>
                  <WarningTwoIcon boxSize="17px" color={RED} />
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">{title}</Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">This action cannot be undone</Text>
                </Box>
              </Flex>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" borderRadius="8px"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose} aria-label="Close" />
            </Flex>

            {/* Body */}
            <Box mb={6} p={4} bg="rgba(252,129,129,0.06)" borderRadius="10px"
              border={`1px solid ${RED}20`}>
              <Text fontSize="13px" color="var(--dash-text-secondary)" lineHeight="1.6">
                Are you sure you want to delete{' '}
                <Text as="span" fontWeight="semibold" color="white">
                  "{itemName}"
                </Text>
                ? All associated data will be permanently removed.
              </Text>
            </Box>

            {/* Actions */}
            <Flex justify="flex-end" gap={3}>
              <Button size="sm" variant="ghost" h="36px" px={5} borderRadius="10px"
                color="var(--dash-text-muted)"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" h="36px" px={6} borderRadius="10px" fontWeight="semibold"
                bg={`${RED}20`} color={RED} border={`1px solid ${RED}50`}
                _hover={{ bg: `${RED}30` }}
                onClick={handleConfirm}>
                Delete
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
