import {
  Typography,
  Box,
  Modal,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="settings-modal-title"
      aria-describedby="settings-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "25rem",
          bgcolor: "background.paper",
          border: "0.125rem solid #000",
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography id="settings-modal-title" variant="h6" component="h2">
          {t("modal_title_settings")}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label={t("settings_test_checkbox")}
          />
        </Box>
      </Box>
    </Modal>
  );
}
