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

type CurrencyTableProps = {
  currencyList: PriceListItem[];
  selectedCurrencies: string[];
  onToggleCurrency: (currency: string) => void;
};

const MAX_FRACTION_DENOMINATOR = 256;

const gcd = (a: number, b: number) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
};

const approximateFraction = (value: number, maxDenominator: number) => {
  let x = Math.abs(value);
  if (x === 0) {
    return { numerator: 0, denominator: 1, error: 0 };
  }

  let a = Math.floor(x);
  let h1 = 1;
  let k1 = 0;
  let h = a;
  let k = 1;

  let iter = 0;
  while (k <= maxDenominator && iter < 32) {
    const fractional = x - a;
    if (fractional < 1e-12) {
      break;
    }
    x = 1 / fractional;
    a = Math.floor(x);
    const h2 = h1 + a * h;
    const k2 = k1 + a * k;
    if (k2 > maxDenominator) {
      break;
    }
    h1 = h;
    k1 = k;
    h = h2;
    k = k2;
    iter += 1;
  }

  const divisor = gcd(h, k);
  const numerator = h / divisor;
  const denominator = k / divisor;
  const approximation = numerator / denominator;
  const error = Math.abs(Math.abs(value) - approximation);
  return { numerator, denominator, error };
};

const formatValue = (rawValue: string | number) => {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return String(rawValue);
  }
  if (value === 0) {
    return "0";
  }

  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const { numerator, denominator, error } = approximateFraction(
    absoluteValue,
    MAX_FRACTION_DENOMINATOR,
  );

  const formatted =
    denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
  const isApproximate = error > Math.max(1e-6, absoluteValue * 0.0025);
  const withApprox = isApproximate ? `~${formatted}` : formatted;

  return isNegative ? `-${withApprox}` : withApprox;
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
              <TableCell>{item.currency}</TableCell>
              <TableCell>{formatValue(item.value.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
