import { memo } from "react";
import { useStaticTradeDataState } from "../../components/session-hooks";

type CurrencyNameProps = {
  currencyKey: string;
};

function CurrencyNameBase({ currencyKey }: CurrencyNameProps) {
  const { currencyNameByKey } = useStaticTradeDataState();
  return <>{currencyNameByKey.get(currencyKey) ?? currencyKey}</>;
}

const CurrencyName = memo(CurrencyNameBase);

export default CurrencyName;
