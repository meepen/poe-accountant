import { memo } from "react";
import { Box } from "@mui/material";
import { useStaticTradeDataState } from "../../components/session-hooks";

type CurrencyNameProps = {
  currencyKey: string;
};

function CurrencyNameBase({ currencyKey }: CurrencyNameProps) {
  const { currencyNameByKey, currencyImageByKey } = useStaticTradeDataState();
  const currencyName = currencyNameByKey.get(currencyKey) ?? currencyKey;
  const currencyImage = currencyImageByKey.get(currencyKey);

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
