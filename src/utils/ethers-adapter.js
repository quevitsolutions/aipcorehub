import { getPublicClient, getConnectorClient } from '@wagmi/core';
import { BrowserProvider, JsonRpcProvider } from 'ethers';

/**
 * Convert a Wagmi Public Client to an Ethers JsonRpcProvider
 */
export function publicClientToProvider(publicClient) {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === 'fallback') {
    return new JsonRpcProvider(transport.transports[0].value?.url, network);
  }
  return new JsonRpcProvider(transport.url, network);
}

/**
 * Action to get an Ethers Provider from a Wagmi Config
 */
export function getEthersProvider(config, { chainId } = {}) {
  const publicClient = getPublicClient(config, { chainId });
  if (!publicClient) return null;
  return publicClientToProvider(publicClient);
}

/**
 * Convert a Wagmi Connector Client to an Ethers Signer
 */
export async function connectorClientToSigner(connectorClient) {
  const { account, chain, transport } = connectorClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = await provider.getSigner(account.address);
  return signer;
}

/**
 * Action to get an Ethers Signer from a Wagmi Config
 */
export async function getEthersSigner(config, { chainId } = {}) {
  const connectorClient = await getConnectorClient(config, { chainId });
  if (!connectorClient) return null;
  return connectorClientToSigner(connectorClient);
}
