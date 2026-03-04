import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PriceListItem } from "./types";
import CurrencyName from "./CurrencyName";

type CurrencyTableProps = {
  currencyList: PriceListItem[];
  selectedCurrencies: string[];
  onToggleCurrency: (currency: string) => void;
};

const formatValue = (
  rawValue: string | number,
  formatter: Intl.NumberFormat,
) => {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return String(rawValue);
  }
  return formatter.format(value);
};

const toNumericValue = (rawValue: string | number) => {
  if (typeof rawValue === "number") {
    return rawValue;
  }
  const normalized = rawValue.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function CurrencyTable({
  currencyList,
  selectedCurrencies,
  onToggleCurrency,
}: CurrencyTableProps) {
  const { t } = useTranslation();
  const [orderBy, setOrderBy] = useState<"currency" | "value">("value");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const valueFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
      }),
    [],
  );

  const sortedCurrencyList = useMemo(() => {
    const sorted = [...currencyList].sort((a, b) => {
      if (orderBy === "currency") {
        return a.currency.localeCompare(b.currency);
      }
      const aValue = toNumericValue(a.value.amount);
      const bValue = toNumericValue(b.value.amount);
      if (aValue === null && bValue === null) {
        return 0;
      }
      if (aValue === null) {
        return 1;
      }
      if (bValue === null) {
        return -1;
      }
      return aValue - bValue;
    });
    return order === "asc" ? sorted : sorted.reverse();
  }, [currencyList, order, orderBy]);

  const handleSort = (column: "currency" | "value") => {
    setOrder((currentOrder) =>
      orderBy === column ? (currentOrder === "asc" ? "desc" : "asc") : "asc",
    );
    setOrderBy(column);
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        flex: 1.2,
        height: "100%",
        minHeight: 0,
        maxHeight: "100%",
        overflow: "auto",
        alignSelf: "stretch",
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead
          sx={{
            "& .MuiTableCell-head": {
              backgroundColor: "background.paper",
            },
          }}
        >
          <TableRow>
            <TableCell>{t("league_inspection_show")}</TableCell>
            <TableCell sortDirection={orderBy === "currency" ? order : false}>
              <TableSortLabel
                active={orderBy === "currency"}
                direction={orderBy === "currency" ? order : "asc"}
                onClick={() => {
                  handleSort("currency");
                }}
              >
                {t("league_inspection_currency")}
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === "value" ? order : false}>
              <TableSortLabel
                active={orderBy === "value"}
                direction={orderBy === "value" ? order : "asc"}
                onClick={() => {
                  handleSort("value");
                }}
              >
                {t("league_inspection_value")}
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCurrencyList.map((item) => (
            <TableRow key={item.currency} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedCurrencies.includes(item.currency)}
                  onChange={() => {
                    onToggleCurrency(item.currency);
                  }}
                  slotProps={{
                    input: {
                      "aria-label": t("league_inspection_toggle_currency", {
                        currency: item.currency,
                      }),
                    },
                  }}
                />
              </TableCell>
              <TableCell>
                <CurrencyName currencyKey={item.currency} />
              </TableCell>
              <TableCell>
                {formatValue(item.value.amount, valueFormatter)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
