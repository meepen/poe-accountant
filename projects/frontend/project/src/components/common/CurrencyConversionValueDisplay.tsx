import { useEffect, useMemo } from "react";
import { Box, Tooltip, type TypographyProps } from "@mui/material";
import type { SharedCurrencyItem } from "../league-context";
import DirectCurrencyValueDisplay from "./DirectCurrencyValueDisplay";

export type DisplayCurrencyKind = "auto" | (string & {});

export interface CurrencyConversionValueDisplayProps {
  quantity: number;
  currency: string;
  displayCurrency?: DisplayCurrencyKind;
  currencyPriceList: SharedCurrencyItem[];
  onBaseCurrencyValueChange?: (value: number) => void;
  variant?: TypographyProps["variant"];
  color?: TypographyProps["color"];
  fontWeight?: TypographyProps["fontWeight"];
  formatOptions?: Intl.NumberFormatOptions;
  showRawValueTooltip?: boolean;
}

export default function CurrencyConversionValueDisplay({
  quantity: inputQuantity,
  currency: inputCurrency,
  displayCurrency = "auto",
  currencyPriceList,
  onBaseCurrencyValueChange,
  variant = "body1",
  color = "text.primary",
  fontWeight,
  formatOptions,
  showRawValueTooltip = false,
}: CurrencyConversionValueDisplayProps) {
  const baseCurrencyValue = useMemo(() => {
    const initialCurrencyData = currencyPriceList.find(
      (item) => item.currency === inputCurrency,
    );
    if (!initialCurrencyData) {
      return inputQuantity;
    }

    return inputQuantity * Number(initialCurrencyData.value.amount);
  }, [currencyPriceList, inputQuantity, inputCurrency]);

  useEffect(() => {
    onBaseCurrencyValueChange?.(baseCurrencyValue);
  }, [baseCurrencyValue, onBaseCurrencyValueChange]);

  const resolvedDisplayCurrency = useMemo(() => {
    if (displayCurrency === "auto") {
      // Determine if we are above one divine, otherwise use chaos as the default display currency
      const divineCurrencyData = currencyPriceList.find(
        (item) => item.currency === "divine",
      );
      if (!divineCurrencyData) {
        return "unknown";
      }

      return baseCurrencyValue >= Number(divineCurrencyData.value.amount)
        ? "divine"
        : divineCurrencyData.value.currency;
    }
    return displayCurrency;
  }, [displayCurrency, currencyPriceList, baseCurrencyValue]);

  const resolvedDisplayValue = useMemo(() => {
    const toCurrencyData = currencyPriceList.find(
      (item) => item.currency === resolvedDisplayCurrency,
    );
    if (!toCurrencyData) {
      return baseCurrencyValue;
    }

    return baseCurrencyValue / Number(toCurrencyData.value.amount);
  }, [baseCurrencyValue, currencyPriceList, resolvedDisplayCurrency]);

  const resolvedFormatOptions = useMemo<Intl.NumberFormatOptions>(() => {
    if (formatOptions) {
      return formatOptions;
    }

    return {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    };
  }, [formatOptions]);

  const rawValueTooltip = useMemo(() => {
    return `${baseCurrencyValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    })} ${inputCurrency}`;
  }, [baseCurrencyValue, inputCurrency]);

  const content = (
    <DirectCurrencyValueDisplay
      quantity={resolvedDisplayValue}
      currency={resolvedDisplayCurrency}
      variant={variant}
      color={color}
      fontWeight={fontWeight}
      formatOptions={resolvedFormatOptions}
    />
  );

  if (showRawValueTooltip && rawValueTooltip) {
    return (
      <Tooltip title={`Raw value: ${rawValueTooltip}`}>
        <Box component="span">{content}</Box>
      </Tooltip>
    );
  }

  return content;
}
