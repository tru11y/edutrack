import { useTheme } from "../../context/ThemeContext";
import Modal, { ModalActions } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "info",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  const confirmBg =
    variant === "danger"
      ? colors.danger
      : variant === "warning"
        ? colors.warning
        : colors.primary;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>
        {message}
      </p>
      <ModalActions>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: colors.bgSecondary,
            color: colors.text,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: confirmBg,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {confirmLabel}
        </button>
      </ModalActions>
    </Modal>
  );
}
