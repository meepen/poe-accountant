import { useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Modal,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSession } from "./SessionContext";

// Placeholder data
const ITEMS = [
  { name: "Divine Orb", price: "245 c" },
  { name: "Mirror of Kalandra", price: "740 d" },
  { name: "Mageblood", price: "320 d" },
  { name: "Headhunter", price: "45 d" },
  { name: "Tabula Rasa", price: "12 c" },
];

function MoneyChart() {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 2,
        height: "35rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.100",
      }}
    >
      <Typography variant="h6" color="text.secondary">
        [Chart Placeholder: Money over Time]
      </Typography>
    </Paper>
  );
}

function ItemTable() {
  return (
    <TableContainer sx={{ height: "100%" }}>
      <Table stickyHeader aria-label="items table">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell align="right">Est. Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ITEMS.map((row) => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function MainApp() {
  const { user } = useSession();
  const [tabIndex, setTabIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };
  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        p: 4,
        gap: 3,
        overflow: "hidden",
      }}
    >
      {/* Left Side */}
      <Box
        sx={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
        }}
      >
        {/* Top Chart */}
        <MoneyChart />

        {/* Bottom Section */}
        <Paper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              pr: 1,
            }}
          >
            <Tabs value={tabIndex} onChange={handleTabChange}>
              <Tab label="View" />
              <Tab label="History" />
            </Tabs>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton aria-label="settings" onClick={handleOpenSettings}>
              <SettingsIcon />
            </IconButton>
          </Box>

          <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
            {tabIndex === 0 && <Typography>View Content Area</Typography>}
            {tabIndex === 1 && <Typography>History Content Area</Typography>}
          </Box>
        </Paper>
      </Box>

      {/* Right Side */}
      <Box
        sx={{
          flex: 1,
          minWidth: "18.75rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6">Items</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <ItemTable />
          </Box>
        </Paper>
      </Box>

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={handleCloseSettings}
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
            Settings
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Test Checkbox"
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
