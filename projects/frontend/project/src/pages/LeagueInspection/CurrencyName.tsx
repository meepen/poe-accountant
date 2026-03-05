import { memo } from "react";
import { Box } from "@mui/material";
import { useStaticTradeData } from "../../components/session-hooks";

type CurrencyNameProps = {
  currencyKey: string;
};

function CurrencyNameBase({ currencyKey }: CurrencyNameProps) {
  const staticTradeData = useStaticTradeData();
  const currencyName =
    staticTradeData.entryById.get(currencyKey)?.entry.text ?? currencyKey;
  const currencyImage = staticTradeData.entryById.get(currencyKey)?.entry.image;

  if (!currencyImage) {
    return <>{currencyName}</>;
  }

  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
    >
      <Box
        component="img"
        src={currencyImage}
        alt={currencyName}
        sx={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }}
      />
      <Box component="span">{currencyName}</Box>
    </Box>
  );
}

const CurrencyName = memo(CurrencyNameBase);

export default CurrencyName;
