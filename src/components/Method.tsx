import React from 'react';
import { Form } from 'react-bootstrap';
import { AbiInput, AbiItem } from 'web3-utils';

interface InterfaceProps {
	abi: AbiItem | null;
	setArgs: (name: string, value: string) => void;
}

const Method: React.FunctionComponent<InterfaceProps> = (props) => {
	const [inputs, setInputs] = React.useState<AbiInput[]>([]);
	const { abi, setArgs } = props;

	React.useEffect(() => {
		setInputs(abi && abi.inputs ? abi.inputs : []);
	}, [abi]);

	function DrawInputs() {
		const items = inputs.map((item: AbiInput, index: number) => (
			<React.Fragment key={index.toString()}>
				<Form.Text className="text-muted">
					<small>{item.name}</small>
				</Form.Text>
				<Form.Control
					type="text"
					size="sm"
					name={item.name}
					placeholder={item.type}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						if (event.target.value[0] === '[') {
							setArgs(event.target.name, JSON.parse(event.target.value));
						} else {
							setArgs(event.target.name, event.target.value);
						}
					}}
				/>
			</React.Fragment>
		));
		return <Form.Group>{items}</Form.Group>;
	}

	return <Form className="Method">{DrawInputs()}</Form>;
};

export default Method;
