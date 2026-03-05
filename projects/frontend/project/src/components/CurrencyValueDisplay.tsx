import { useEffect, useMemo } from "react";
import { Box, Typography, type TypographyProps } from "@mui/material";
import { useLeagueSelection, useStaticTradeDataState } from "./session-hooks";

export type DisplayCurrencyKind = "chaos" | "divine";

interface CurrencyValueDisplayProps {
  value: number | null;
  quantity?: number;
  inputCurrency: string;
  displayCurrency?: DisplayCurrencyKind;
  onChaosValueChange?: (value: number | null) => void;
  variant?: TypographyProps["variant"];
  color?: TypographyProps["color"];
  fontWeight?: TypographyProps["fontWeight"];
  formatOptions?: Intl.NumberFormatOptions;
}

const POE_IMAGE_BASE_URL = "https://pathofexile.com";

interface SharedCurrencyRate {
  currency: string;
  value: {
    currency: string;
    amount: string;
  };
}

function resolvePoeImageUrl(image: string | undefined): string {
  if (!image) {
    return "/vite.svg";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `${POE_IMAGE_BASE_URL}${image}`;
}

function normalizeSharedCurrencyList(value: unknown): SharedCurrencyRate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap<SharedCurrencyRate>((item): SharedCurrencyRate[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const rawValue = record.value;
    if (!rawValue || typeof rawValue !== "object") {
      return [];
    }

    const valueRecord = rawValue as Record<string, unknown>;
    const currency = record.currency;
    const stableCurrency = valueRecord.currency;
    const amount = valueRecord.amount;

    if (
      typeof currency !== "string" ||
      typeof stableCurrency !== "string" ||
      typeof amount !== "string"
    ) {
      return [];
    }

    return [
      {
        currency,
        value: {
          currency: stableCurrency,
          amount,
        },
      },
    ];
  });
}

function normalizeChaosPerDivine(rate: number): number | null {
  if (!Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return rate >= 1 ? rate : 1 / rate;
}

function parsePositiveNumber(value: string): number | null {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }
  return numericValue;
}

export default function CurrencyValueDisplay({
  value,
  quantity = 1,
  inputCurrency,
  displayCurrency,
  onChaosValueChange,
  variant = "body1",
  color = "text.primary",
  fontWeight,
  formatOptions,
}: CurrencyValueDisplayProps) {
  const { snapshot } = useStaticTradeDataState();
  const { sharedCurrencyList } = useLeagueSelection();
  const normalizedSharedCurrencyList = useMemo(
    () => normalizeSharedCurrencyList(sharedCurrencyList as unknown),
    [sharedCurrencyList],
  );

  const chaosPerDivine = useMemo(() => {
    const direct = normalizedSharedCurrencyList.find(
      (item) => item.currency === "divine" && item.value.currency === "chaos",
    );

    if (direct) {
      const normalizedRate = normalizeChaosPerDivine(Number(direct.value.amount));
      if (normalizedRate !== null) {
        return normalizedRate;
      }
    }

    const inverse = normalizedSharedCurrencyList.find(
      (item) => item.currency === "chaos" && item.value.currency === "divine",
    );

    if (inverse) {
      const inverseAmount = Number(inverse.value.amount);
      if (!Number.isNaN(inverseAmount) && inverseAmount > 0) {
        const normalizedRate = normalizeChaosPerDivine(1 / inverseAmount);
        if (normalizedRate !== null) {
          return normalizedRate;
        }
      }
    }

    return null;
  }, [normalizedSharedCurrencyList]);

  const inputToChaosRate = useMemo(() => {
    if (inputCurrency === "chaos") {
      return 1;
    }

    if (inputCurrency === "divine") {
      return chaosPerDivine;
    }

    const direct = normalizedSharedCurrencyList.find(
      (item) => item.currency === inputCurrency && item.value.currency === "chaos",
    );
    if (direct) {
      return parsePositiveNumber(direct.value.amount);
    }

    const inverse = normalizedSharedCurrencyList.find(
      (item) => item.currency === "chaos" && item.value.currency === inputCurrency,
    );
    if (inverse) {
      const inverseAmount = parsePositiveNumber(inverse.value.amount);
      if (inverseAmount !== null) {
        return 1 / inverseAmount;
      }
    }

    return null;
  }, [chaosPerDivine, inputCurrency, normalizedSharedCurrencyList]);

  const calculatedInputValue = useMemo(() => {
    if (value === null) {
      return null;
    }

    return value * quantity;
  }, [quantity, value]);

  const valueInChaos = useMemo(() => {
    if (calculatedInputValue === null) {
      return null;
    }

    if (inputToChaosRate !== null) {
      return calculatedInputValue * inputToChaosRate;
    }

    return calculatedInputValue;
  }, [calculatedInputValue, inputToChaosRate]);

  useEffect(() => {
    onChaosValueChange?.(valueInChaos);
  }, [onChaosValueChange, valueInChaos]);

  const resolvedDisplayCurrency: DisplayCurrencyKind = useMemo(() => {
    if (displayCurrency) {
      return displayCurrency;
    }

    if (valueInChaos !== null && chaosPerDivine && valueInChaos >= chaosPerDivine) {
      return "divine";
    }

    return "chaos";
  }, [chaosPerDivine, displayCurrency, valueInChaos]);

  const resolvedValue = useMemo(() => {
    if (calculatedInputValue === null) {
      return null;
    }

    if (resolvedDisplayCurrency === inputCurrency) {
      return calculatedInputValue;
    }

    if (!chaosPerDivine || valueInChaos === null) {
      return calculatedInputValue;
    }

    if (resolvedDisplayCurrency === "divine") {
      return valueInChaos / chaosPerDivine;
    }

    return valueInChaos;
  }, [
    chaosPerDivine,
    calculatedInputValue,
    inputCurrency,
    resolvedDisplayCurrency,
    valueInChaos,
  ]);

  const resolvedFormatOptions = useMemo<Intl.NumberFormatOptions>(() => {
    if (formatOptions) {
      return formatOptions;
    }

    return {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    };
  }, [formatOptions]);

  const { chaosOrbImageUrl, divineOrbImageUrl, chaosName, divineName } = useMemo(() => {
    if (!snapshot) {
      return {
        chaosOrbImageUrl: "/vite.svg",
        divineOrbImageUrl: "/vite.svg",
        chaosName: "Chaos",
        divineName: "Divine",
      };
    }

    const entries = snapshot.data.result.flatMap((category) => category.entries);
    const chaosEntry = entries.find((entry) => entry.id === "chaos");
    const divineEntry = entries.find((entry) => entry.id === "divine");

    return {
      chaosOrbImageUrl: resolvePoeImageUrl(chaosEntry?.image),
      divineOrbImageUrl: resolvePoeImageUrl(divineEntry?.image),
      chaosName: chaosEntry?.text ?? "Chaos",
      divineName: divineEntry?.text ?? "Divine",
    };
  }, [snapshot]);

  const imageUrl =
    resolvedDisplayCurrency === "divine" ? divineOrbImageUrl : chaosOrbImageUrl;
  const alt = resolvedDisplayCurrency === "divine" ? divineName : chaosName;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Typography variant={variant} color={color} fontWeight={fontWeight}>
        {resolvedValue !== null
          ? resolvedValue.toLocaleString(undefined, resolvedFormatOptions)
          : "--"}
      </Typography>
      <img src={imageUrl} alt={alt} width={24} height={24} />
    </Box>
  );
}
