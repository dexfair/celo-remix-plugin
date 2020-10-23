import React from 'react'
import { Button, Container, Form, FormControl, InputGroup } from 'react-bootstrap'
import { createIframeClient } from "@remixproject/plugin"
import { Celo } from "@dexfair/celo-web-signer"

function App() {
  const [client, setClient] = React.useState(null)
  const [language, setLanguage] = React.useState('')
  const [fileName, setFileName] = React.useState('')
  const [data, setData] = React.useState([])
  const [constructor, setConstructor] = React.useState([])

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

  async function deploy() {
    if (!busy) {
      setBusy(true)
      const contractData = data[contract.replace(` - ${fileName}`, '')]
      const newContract = new celo.kit.web3.eth.Contract(JSON.parse(JSON.stringify(contractData.abi)))
      const args = []
      for(let i = 0; i < constructor.length; i++) {
        if (constructor[i].type[constructor[i].type.length-1] === ']') {
          args.push(JSON.parse(constructor[i].value))
        } else {
          args.push(constructor[i].value.toString())
        }
      }
      try {
        const rawTx = {
          from: account,
          data: newContract.deploy({ data: `0x${contractData.evm.bytecode.object}`, arguments: args }).encodeABI()
        }
        const tx = await celo.sendTransaction(rawTx)
        const txReceipt = await tx.waitReceipt()
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
    setConstructor([])
    for(let i = 0; i < contract.abi.length; i++) {
      if(contract.abi[i].type === 'constructor') {
        const temp = JSON.parse(JSON.stringify(contract.abi[i].inputs))
        for (let i = 0; i < temp.length; i++) {
          temp[i].value = ''
          temp[i].onChange = (e) => {
            temp[i].value = e.target.value
          }
        }
        setConstructor(temp)
        break
      }
    }
  }

  function MethodParmsForm(props) {
    const list = props.parms
    const items = list.map((parm, index) => (
      <Form.Group key={index.toString()}>
        <Form.Text className="text-muted">
          <small>{parm.name}</small>
        </Form.Text>
        <Form.Control type="text" placeholder={parm.name} onChange={parm.onChange} size="sm" />
      </Form.Group>))
    return (
      <Form>
        <Contracts contracts={data} fileName={fileName} />
        { items }
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
          <hr />
          <Form.Group>
            <Form.Text className="text-muted">
              <small>ACCOUNT</small>
            </Form.Text>
            <Form.Control type="text" placeholder="Account" value={account} size="sm" readOnly />
          </Form.Group>
          <Networks />
        </Form>
        <hr />
        <MethodParmsForm parms={constructor} />
        <hr />
        <InputGroup className="mb-3">
          <FormControl value={contractAdr0} size="sm" readOnly />
          <InputGroup.Append>
            <Button
              variant="warning"
              size="sm"
              onClick={() => { window.open(`${NETWORK[network].blockscout}/address/${contractAdr0}`) }} disabled={busy || contractAdr0 === ''}
            >
              <i class="fas fa-globe" />
            </Button>
            <Button variant="warning" block onClick={deploy} size="sm" disabled={busy}>
              <small>Deploy</small>
            </Button>
          </InputGroup.Append>
        </InputGroup>
        <p className="text-center"><small>OR</small></p>
        <InputGroup className="mb-3">
          <FormControl  size="sm" />
          <InputGroup.Append>
            <Button
              variant="primary"
              size="sm"
            >
              At Address
            </Button>
          </InputGroup.Append>
        </InputGroup>
        <hr />
        <p className="text-center"><small>Deployed Contracts</small></p>
      </Container>
    </div>
  )
}

export default App
