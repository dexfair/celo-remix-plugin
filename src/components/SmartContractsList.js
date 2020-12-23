import React from 'react'
import { Accordion, Alert, Button, Card, Form, FormControl, InputGroup } from 'react-bootstrap'
import { NETWORKS } from "@dexfair/celo-web-signer"

function SmartContract(props) {
  const list = props.parms.abi ? props.parms.abi : []
  const items = list.map((parm, index) => (
    <Accordion key={index}>
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey={index.toString()} className="p-1">
          <small>{parm.name}</small>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey={index.toString()}>
          <Method abi={parm} address={props.parms.address} celo={props.celo}/>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  ))
  return (
    <Form>
      {items}
    </Form>
  )
}

function Method(props) {
  const [value, setValue] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const singleAbi = setAbiArgs(props.abi)

  return (
    <Card.Body className="p-2">
      <MethodArgs singleAbi={singleAbi} />
      <Alert variant='danger' onClose={() => setError('')} dismissible hidden={error===''}>
        <small>{error}</small>
      </Alert>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <Button
            variant={singleAbi.stateMutability === 'view' ? 'primary' : 'warning'}
            block
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const newContract = new props.celo.kit.web3.eth.Contract(JSON.parse(JSON.stringify([props.abi])), props.address)
              const accounts = await props.celo.getAccounts()
              const temp = getAbiArgs(singleAbi)
              if (props.abi.stateMutability === 'view') {
                try {
                  const txReceipt = await newContract.methods[props.abi.name](...temp).call({from: accounts[0]})
                  setValue(txReceipt)
                  // TODO: LOG
                } catch (error) {
                  console.error(error)
                  setError(error.toString())
                }
              } else {
                try {
                  const txReceipt = await newContract.methods[props.abi.name](...temp).send({from: accounts[0]})
                  console.log(txReceipt)
                  // TODO: LOG
                } catch (error) {
                  console.error(error)
                  setError(error.toString())
                }
              }
              setBusy(false)
            }}
            size="sm"
          >
            <small>{props.abi.stateMutability === 'view' ? 'call' : 'transact'}</small>
          </Button>
        </InputGroup.Prepend>
        <FormControl value={value} size="sm" readOnly hidden={props.abi.stateMutability !== 'view'} />
      </InputGroup>
    </Card.Body>
  )
}

export function setAbiArgs(singleAbi) {
  const temp = JSON.parse(JSON.stringify(singleAbi))
  for (let i = 0; i < temp.inputs.length; i++) {
    temp.inputs[i].value = ''
    temp.inputs[i].onChange = (e) => {
      temp.inputs[i].value = e.target.value
    }
  }
  return temp
}

export function getAbiArgs(singleAbi) {
  const temp = []
  if (singleAbi && singleAbi.inputs) {
    for(let i = 0; i < singleAbi.inputs.length; i++) {
      if (singleAbi.inputs[i].type[singleAbi.inputs[i].type.length-1] === ']') {
        temp.push(JSON.parse(singleAbi.inputs[i].value))
      } else {
        temp.push(singleAbi.inputs[i].value.toString())
      }
    }
  }
  return temp
}

export function MethodArgs(props) {
  const list = props.singleAbi.inputs ? props.singleAbi.inputs : []
  const items = list.map((item, index) => (
    <Form.Group key={index.toString()}>
      <Form.Text className="text-muted">
        <small>{item.name}</small>
      </Form.Text>
      <Form.Control type="text" placeholder={item.type} onChange={item.onChange} size="sm" />
    </Form.Group>))
  return (
    <Form>
      {items}
    </Form>
  )
}

export function SmartContractsList(props) {
  const items = props.smartContracts.map((parm, index) => (
    <div key={`${parm.address}:${index}`}>
      <Card className="mb-3">
        <Card.Header className="p-1">
          <Accordion.Toggle
            as={Button} 
            size="sm"
            variant="link"
            eventKey={`${parm.address}:${index}`}
            hidden={parm.abi.length===0}
          >
            <i class="far fa-plus-square" />
          </Accordion.Toggle>
          <strong className="align-middle">
            {parm.name}
          </strong>
          <Button
            className="float-right align-middle"
            size="sm"
            variant="link"
            onClick={() => { window.open(`${NETWORKS[props.network].blockscout}/address/${parm.address}`) }}
          >
            <i class="fas fa-external-link-alt" />
          </Button>
          <Button
            className="float-right align-middle"
            size="sm"
            variant="link"
            onClick={() => {props.removeContract(index)}}
          >
            <i class="fas fa-trash-alt" />
          </Button>
        </Card.Header>
        <Accordion.Collapse eventKey={`${parm.address}:${index}`}>
          <SmartContract parms={parm} celo={props.celo} />
        </Accordion.Collapse>
      </Card>
    </div>
  ))
  return (
    <Accordion>
      {items}
    </Accordion>
  )
}
