import { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  refreshInterval: 30_000,
  revalidateOnFocus: true,
  dedupingInterval: 10_000,
};
