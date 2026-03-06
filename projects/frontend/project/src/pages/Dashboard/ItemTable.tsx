import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import CurrencyConversionValueDisplay from "../../components/common/CurrencyConversionValueDisplay";
import type { SharedCurrencyItem } from "../../components/league-context";
import type { DashboardItem } from "./types";

interface ItemTableProps {
  items: DashboardItem[];
  snapshotCurrencyList: SharedCurrencyItem[];
  onRowBaseValueChange: (itemId: string, value: number) => void;
}

export default function ItemTable({
  items,
  snapshotCurrencyList,
  onRowBaseValueChange,
}: ItemTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer sx={{ height: "100%" }}>
      <Table stickyHeader aria-label={t("dashboard_items_table_aria")}>
        <TableHead>
          <TableRow>
            <TableCell>{t("table_header_item")}</TableCell>
            <TableCell align="right">{t("table_header_est_price")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell component="th" scope="row">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {`${row.quantity}x`}
                  </Typography>
                  <img
                    src={row.imageUrl}
                    alt={row.name}
                    width={24}
                    height={24}
                  />
                  {row.name}
                </Box>
              </TableCell>
              <TableCell align="right">
                <CurrencyConversionValueDisplay
                  quantity={row.quantity}
                  currency={row.currencyId}
                  currencyPriceList={snapshotCurrencyList}
                  onBaseCurrencyValueChange={(value) => {
                    onRowBaseValueChange(row.id, value);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
