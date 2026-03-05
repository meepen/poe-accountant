import { useMemo } from "react";
import { Box, Tooltip, Typography, type TypographyProps } from "@mui/material";
import { useStaticTradeData } from "../session-hooks";

export interface DirectCurrencyValueDisplayProps {
  quantity: number;
  currency: string;
  variant?: TypographyProps["variant"];
  color?: TypographyProps["color"];
  fontWeight?: TypographyProps["fontWeight"];
  formatOptions?: Intl.NumberFormatOptions;
  showRawValueTooltip?: boolean;
}

export default function DirectCurrencyValueDisplay({
  quantity,
  currency,
  variant = "body1",
  color = "text.primary",
  fontWeight,
  formatOptions,
  showRawValueTooltip = false,
}: DirectCurrencyValueDisplayProps) {
  const staticTradeData = useStaticTradeData();

  const resolvedDisplayIcon = useMemo(() => {
    return staticTradeData.entryById.get(currency)?.entry.image || undefined;
  }, [currency, staticTradeData]);

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
    return `${quantity.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    })} ${currency}`;
  }, [quantity, currency]);

  const content = (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Typography variant={variant} color={color} fontWeight={fontWeight}>
        {quantity.toLocaleString(undefined, resolvedFormatOptions)}
      </Typography>
      <img src={resolvedDisplayIcon} alt={currency} width={24} height={24} />
    </Box>
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
