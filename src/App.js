import React from 'react'
import { Button, Card, Container, Form, FormControl, InputGroup } from 'react-bootstrap'
import { createIframeClient } from "@remixproject/plugin"
import { Celo } from "@dexfair/celo-web-signer"
import Footer from "./Footer";

function App() {
  const [client, setClient] = React.useState(null)
  const [language, setLanguage] = React.useState('')
  const [fileName, setFileName] = React.useState('')
  const [data, setData] = React.useState([])
  const [constructor, setConstructor] = React.useState({})

  const [account, setAccount] = React.useState('')
  const [network, setNetwork] = React.useState('Mainnet')
  const [contract, setContract] = React.useState('')
  const [contractAdr0, setContractAdr0] = React.useState('')

  const [celo, setCelo] = React.useState(null)
  const [busy, setBusy] = React.useState(false)

  const NETWORK = {
    Mainnet: { provider: 'https://rc1-forno.celo-testnet.org', blockscout: 'https://explorer.celo.org' },
    Baklava: { provider: 'https://baklava-forno.celo-testnet.org', blockscout: 'https://baklava-blockscout.celo-testnet.org' },
    Alfajores: { provider: 'https://alfajores-forno.celo-testnet.org', blockscout: 'https://alfajores-blockscout.celo-testnet.org' }
  }

  React.useEffect(() => {
    async function init () {
      if (!client) {
        setClient(createIframeClient())
        setCelo(new Celo())
      } else {
        await client.onload()
        client.solidity.on('compilationFinished', (fileName, source, languageVersion, data) => {
          // console.log(fileName, source, languageVersion, data)
          setFileName(fileName)
          setLanguage(languageVersion)
          setData(data.contracts[fileName])
          setContract(Object.keys(data.contracts[fileName]).length > 0 ? Object.keys(data.contracts[fileName])[0] : '')
          getConstructor(data.contracts[fileName][Object.keys(data.contracts[fileName])[0]])
        })
        await celo.init(NETWORK[network].provider, setAccount)
      }
    }
    init()
  })

  async function connect() {
    if (window.ethereum) {
      window.ethereum.enable();
    }
  }

  async function deploy() {
    if (!busy) {
      setBusy(true)
      const contractData = data[contract.replace(` - ${fileName}`, '')]
      const newContract = new celo.kit.web3.eth.Contract(JSON.parse(JSON.stringify(contractData.abi)))
      const args = []
      for(let i = 0; i < constructor.inputs.length; i++) {
        if (constructor.inputs[i].type[constructor.inputs[i].type.length-1] === ']') {
          args.push(JSON.parse(constructor.inputs[i].value))
        } else {
          args.push(constructor.inputs[i].value.toString())
        }
      }
      try {
        const rawTx = {
          from: account,
          data: newContract.deploy({ data: `0x${contractData.evm.bytecode.object}`, arguments: args }).encodeABI()
        }
        const txReceipt = await celo.sendTransaction(rawTx)
        setContractAdr0(txReceipt.contractAddress)
        // console.log(txReceipt.transactionHash)
        setBusy(false)
      } catch (error) {
        // eslint-disable-next-line
        console.log(error)
        setBusy(false)
      }
    }
  }

  function atAddress() {
    // TODO: interact with deployed contract
  }

  function getConstructor(contract) {
    setConstructor({})
    for(let i = 0; i < contract.abi.length; i++) {
      if(contract.abi[i].type === 'constructor') {
        const temp = JSON.parse(JSON.stringify(contract.abi[i]))
        for (let i = 0; i < temp.inputs.length; i++) {
          temp.inputs[i].value = ''
          temp.inputs[i].onChange = (e) => {
            temp.inputs[i].value = e.target.value
          }
        }
        setConstructor(temp)
        break
      }
    }
  }

  function MethodParmsForm(props) {
    const list = props.parms.inputs ? props.parms.inputs : []
    const items = list.map((parm, index) => (
      <Form.Group key={index.toString()}>
        <Form.Text className="text-muted">
          <small>{parm.name}</small>
        </Form.Text>
        <Form.Control type="text" placeholder={parm.type} onChange={parm.onChange} size="sm" />
      </Form.Group>))
    return (
      <Form>
        <Contracts contracts={data} fileName={fileName} />
        <div className={list.length === 0 ? 'd-none' : ''}>
          <Card>
            <Card.Header size="sm">
              <small>{ (props.parms.name || props.parms.type) }</small>
            </Card.Header>
            <Card.Body>
              { items }
            </Card.Body>
          </Card>
        </div>
      </Form>
    )
  }

  function handelContract(e) {
    setContract(e.target.value)
    getConstructor(data[e.target.value.replace(` - ${fileName}`, '')])
  }

  function Networks() {
    const list = NETWORK
    const items = Object.keys(list).map((key) => <option key={key}>{key}</option> )
    return (
      <Form.Group>
        <Form.Text className="text-muted">
          <small>NETWORK</small>
        </Form.Text>
        <Form.Control as="select" value={network} onChange={(e) => setNetwork(e.target.value)} size="sm">
          {items}
        </Form.Control>    
      </Form.Group>
    )
  }

  function Contracts(props) {
    const list = props.contracts
    const items = Object.keys(list).map((key) => <option key={key}>{`${key} - ${props.fileName}`}</option> )
    return (
      <Form.Group>
        <Form.Text className="text-muted">
          <small>CONTRACT</small>
        </Form.Text>
        <Form.Control as="select" value={contract} onChange={handelContract} size="sm">
          {items}
        </Form.Control>
      </Form.Group>
    )
  }

  return (
    <div className="App">
      <Container>
        <Form>
          <Form.Group>
            <Form.Text className="text-muted">
              <small>LANGUAGE</small>
            </Form.Text>
            <Form.Control type="text" placeholder="Language" value={language} size="sm" readOnly />
          </Form.Group>
          <Form.Group>
            <Form.Text className="text-muted">
              <small>FILE NAME</small>
            </Form.Text>
            <Form.Control type="text" placeholder="File Name" value={fileName} size="sm" readOnly />
          </Form.Group>
          <Form.Group>
          <Form.Text className="text-muted">
            <small>ACCOUNT</small>
          </Form.Text>
          <InputGroup>
            <Form.Control type="text" placeholder="Account" value={account} size="sm" readOnly />
            <InputGroup.Append>
              <Button className={account !== '' ? 'd-none' : ''} variant="warning" block onClick={connect} size="sm">
                <small>Connect</small>
              </Button>
            </InputGroup.Append>
          </InputGroup>
          </Form.Group>
          <Networks />
        </Form>
        <hr />
        <MethodParmsForm parms={constructor} />
        <InputGroup className="mb-3">
          <FormControl value={contractAdr0} size="sm" readOnly />
          <InputGroup.Append>
            <Button
              variant="warning"
              size="sm"
              onClick={() => { window.open(`${NETWORK[network].blockscout}/address/${contractAdr0}`) }} disabled={busy || contractAdr0 === ''}
            >
              <i className="fas fa-globe" />
            </Button>
            <Button variant="warning" block onClick={deploy} size="sm" disabled={busy || account === ''}>
              <small>Deploy</small>
            </Button>
          </InputGroup.Append>
        </InputGroup>
        <p className="text-center"><small>OR</small></p>
        <InputGroup className="mb-3">
          <FormControl size="sm" />
          <InputGroup.Append>
            <Button
              variant="primary"
              size="sm"
              onClick={atAddress}
            >
              At Address
            </Button>
          </InputGroup.Append>
        </InputGroup>
        <hr />
        <p className="text-center"><small>Deployed Contracts</small></p>
      </Container>
      <Footer
        children={<small>by DexFair</small>}
      />
    </div>
  )
}

export default App
