
import { Web3Provider } from '@ethersproject/providers';
import { InjectedConnector } from "@web3-react/injected-connector";
import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';

//this will give instance of library we want ether.js or web3.js i prefer use ether.js
export const getLibrary = (provider) => {
    const library = new Web3Provider(provider);
    library.pollingInterval = 8000;
    return library;
}

export const metaMask = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42]
});

export function useEagerConnect() {
    const { activate, active } = useWeb3React();
    const [tried, setTried] = useState(false);

    useEffect(() => {
        metaMask.isAuthorized().then((isAuthorized) => {
            if (isAuthorized) {
                activate(metaMask, undefined, true).catch(() => {
                    setTried(true);
                });
            } else {
                setTried(true);
            }
        });
    }, [activate]); // intentionally only running on mount (make sure it's only mounted once :))

    // if the connection worked, wait until we get confirmation of that to flip the flag
    useEffect(() => {
        if (!tried && active) {
            setTried(true);
        }
    }, [tried, active]);

    return tried;
}

//this hook will handle account and chain changes in wallet
export function useInactiveListener(suppress = false) {
    const { active, error, activate } = useWeb3React();

    useEffect(() => {
        const { ethereum } = window;
        if (ethereum && ethereum.on && !active && !error && !suppress) {
            const handleChainChanged = (chainId) => {
                console.log('chainChanged', chainId);
                activate(metaMask);
            };

            const handleAccountsChanged = (accounts) => {
                console.log('accountsChanged', accounts);
                if (accounts.length > 0) {
                    activate(metaMask);
                }
            };

            const handleNetworkChanged = (networkId) => {
                console.log('networkChanged', networkId);
                activate(metaMask);
            };

            ethereum.on('chainChanged', handleChainChanged);
            ethereum.on('accountsChanged', handleAccountsChanged);
            ethereum.on('networkChanged', handleNetworkChanged);

            return () => {
                if (ethereum.removeListener) {
                    ethereum.removeListener('chainChanged', handleChainChanged);
                    ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    ethereum.removeListener('networkChanged', handleNetworkChanged);
                }
            };
        }

        return () => { };
    }, [active, error, suppress, activate]);
}