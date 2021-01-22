import { AbiItem } from 'web3-utils';

export interface InterfaceContract {
	name: string;
	address: string;
	abi: AbiItem[];
}
