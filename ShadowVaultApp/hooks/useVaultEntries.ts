// hooks/useVaultEntries.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";

// This should be your Envio GraphQL endpoint, which you can get from the Envio dashboard
// For now, we'll use a placeholder.
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_ENVIRO_GQL_ENDPOINT || "http://localhost:8080/v1/graphql";

const GET_VAULT_ENTRIES = gql`
  query GetVaultEntries($user: Bytes!) {
    VaultEntry(where: { user: { _eq: $user }, isActive: { _eq: true } }, orderBy: { timestamp: "desc" }) {
      id
      entryId
      metadataHash
      timestamp
      isActive
    }
  }
`;

interface VaultEntry {
  id: string;
  entryId: string; // BigInt is returned as a string by GraphQL
  metadataHash: string; // Bytes is returned as a hex string
  timestamp: string; // BigInt is returned as a string
  isActive: boolean;
}

interface VaultEntriesData {
  VaultEntry: VaultEntry[];
}

export function useVaultEntries(userAddress?: string) {
  return useQuery<VaultEntriesData, Error>({
    queryKey: ["vaultEntries", userAddress],
    queryFn: async () => {
      if (!userAddress) {
        throw new Error("User address is not defined.");
      }
      return request(GQL_ENDPOINT, GET_VAULT_ENTRIES, {
        user: userAddress.toLowerCase(),
      });
    },
    enabled: !!userAddress, // The query will not run until the userAddress is available
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
