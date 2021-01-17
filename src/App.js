import React from 'react'
import { Alert, Button, Card, Container, Form, FormControl, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { createIframeClient } from "@remixproject/plugin"
import { Celo, NETWORKS } from "@dexfair/celo-web-signer"
import { getAbiArgs, setAbiArgs, MethodArgs, SmartContractsList } from "./components/SmartContractsList"

function App() {
  const [client, setClient] = React.useState(null)
  const [language, setLanguage] = React.useState('')
  const [fileName, setFileName] = React.useState('')
  const [data, setData] = React.useState([])
  const [constructor, setConstructor] = React.useState({})

  const [account, setAccount] = React.useState('')
  const [network, setNetwork] = React.useState('Mainnet')
  const [selectFileName, setSelectFileName] = React.useState('')
  const [iconSpin, setIconSpin] = React.useState('')
  const [contract, setContract] = React.useState('')
  const [contractAdr0, setContractAdr0] = React.useState('')
  const [contractAdr1, setContractAdr1] = React.useState('')
  const [error0, setError0] = React.useState('')
  const [error1, setError1] = React.useState('Currently you have no contract instances to interact with.')
  const [smartContracts, setSmartContracts] = React.useState([])

  const [celo, setCelo] = React.useState(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    async function init () {
      if (!client) {
        setClient(createIframeClient())
        const temp = new Celo()
        setCelo(temp)
      } else {
        await client.onload()
        client.solidity.on('compilationFinished', (fn, source, languageVersion, data) => {
          console.log(fn, source, languageVersion, data)
          setFileName(fn)
          setLanguage(languageVersion)
          setData(data.contracts[fn])
          setContract(Object.keys(data.contracts[fn]).length > 0 ? Object.keys(data.contracts[fn])[0] : '')
          getConstructor(data.contracts[fn][Object.keys(data.contracts[fn])[0]])
        })
        try {
          setSelectFileName((await client.fileManager.getCurrentFile()))
        } catch (error) {
          console.error(error)
        }
        client.on('fileManager', 'currentFileChanged', (fn) => {
          // console.log(fn)
          setSelectFileName(fn)
        })
      }
    }
    init()
  })

  async function connect() {
    if (!celo.isConnected) {
      await celo.connect(NETWORKS[network], setNetwork, (accounts) => {setAccount(accounts[0])})
    }
  }

  async function deploy() {
    if (!busy) {
      setBusy(true)
      const contractData = data[contract]
      const newContract = new celo.kit.web3.eth.Contract(JSON.parse(JSON.stringify(contractData.abi)))
      const temp = getAbiArgs(constructor)
      try {
        const rawTx = {
          from: account,
          data: newContract.deploy({ data: `0x${contractData.evm.bytecode.object}`, arguments: temp }).encodeABI()
        }
        const txReceipt = await celo.sendTransaction(rawTx)
        setContractAdr0(txReceipt.contractAddress)
        // console.log(txReceipt.transactionHash)
        addSmartContracts(txReceipt.contractAddress)
        // TODO: LOG
        setBusy(false)
      } catch (error) {
        // eslint-disable-next-line
        console.error(error)
        setError0(error.message ? error.message : error.toString())
        setBusy(false)
      }
    }
  }

  function addSmartContracts(address) {
    if (contract && celo.kit.web3.utils.isAddress(address)) {
      try {
        const contractData = data[contract]
        const functionABIs0 = []
        const functionABIs1 = []
        contractData.abi.forEach(element=>{
          if(element.type === 'function') {
            if(element.stateMutability === 'view') {
              functionABIs0.push(element)
            } else {
              functionABIs1.push(element)
            }
          }
        })
        const instance = {
          name: contract,
          address: address,
          abi: functionABIs1.concat(functionABIs0)
        }
        setSmartContracts(smartContracts.concat([instance]))
      } catch (error) {
        console.error(error)
      }
    } else {
      if (!contract) {
        setError1('No contract selected.')
      } else {
        setError1(`${address} is not address.`)
      }
    }
  }

  function removeContract (index) {
    setSmartContracts(smartContracts.slice(0, index).concat(smartContracts.slice(index+1)))
    setError1('Currently you have no contract instances to interact with.')
  }

  async function compile() {
    setBusy(true)
    setIconSpin('fa-spin')
    await client.solidity.compile(selectFileName)
    setIconSpin('')
    setBusy(false)
  }

  function getConstructor(newContract) {
    setConstructor({})
    for(let i = 0; i < newContract.abi.length; i++) {
      if(newContract.abi[i].type === 'constructor') {
        setConstructor(setAbiArgs(newContract.abi[i]))
        break
      }
    }
  }

  function Networks() {
    const list = NETWORKS
    const items = Object.keys(list).map((key) => <option key={key} value={key}>{key}</option> )
    return (
      <Form.Group>
        <Form.Text className="text-muted">
          <small>NETWORK</small>
        </Form.Text>
        <Form.Control as="select" value={network} onChange={(e) => {
          setBusy(true)
          setNetwork(e.target.value)
          celo.changeNetwork(NETWORKS[e.target.value])
          setBusy(false)
        }}>
          {items}
        </Form.Control>
      </Form.Group>
    )
  }

  function Contracts(props) {
    const list = props.contracts
    const items = Object.keys(list).map((key) => <option key={key} value={key}>{`${key} - ${props.fileName}`}</option> )
    return (
      <Form.Group>
        <Form.Text className="text-muted">
          <small>CONTRACT</small>
        </Form.Text>
        <Form.Control as="select" value={contract} onChange={(e) => {
          setContract(e.target.value)
          getConstructor(data[e.target.value])
        }}>
          {items}
        </Form.Control>
      </Form.Group>
    )
  }

  return (
    <div className="App">
      <Container>
        <Form>
          <Form.Group hidden>
            <Form.Text className="text-muted">
              <small>LANGUAGE</small>
            </Form.Text>
            <Form.Control type="text" placeholder="Language" value={language} size="sm" readOnly />
          </Form.Group>
          <Form.Group hidden>
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
              <OverlayTrigger
                placement="left"
                overlay={<Tooltip>Connect to Wallet</Tooltip>}
              >
                <Button className={account !== '' ? 'd-none' : ''} variant="warning" block onClick={connect} size="sm">
                  <small>Connect</small>
                </Button>
              </OverlayTrigger>
            </InputGroup.Append>
          </InputGroup>
          </Form.Group>
          <Networks />
        </Form>
        <hr />
        <Button
          variant="primary"
          onClick={compile}
          block
          disabled={selectFileName===''}
        >
          <i className={`fas fa-sync ${iconSpin}`} style={{marginRight: '0.3em'}} />
          <span>
            Compile&nbsp;{`${selectFileName===''?'<no file selected>':selectFileName.split('/')[selectFileName.split('/').length-1]}`}
          </span>
        </Button>
        <Form>
          <Contracts contracts={data} fileName={fileName} />
          <Card hidden={!(constructor && constructor.inputs && constructor.inputs.length > 0)}>
            <Card.Body className='p-2'>
              <MethodArgs singleAbi={constructor} />
            </Card.Body>
          </Card>
          <InputGroup className="mb-3">
            <FormControl value={contractAdr0} placeholder="contract address" size="sm" readOnly />
            <InputGroup.Append>
              <OverlayTrigger
                placement="left"
                overlay={<Tooltip>Open Celo blockscout</Tooltip>}
              >
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => { window.open(`${NETWORKS[network].blockscout}/address/${contractAdr0}`) }}
                  hidden={busy || contractAdr0 === ''}
                >
                  <small>Link</small>
                </Button>
              </OverlayTrigger>
              <Button
                variant="warning"
                block
                onClick={deploy}
                size="sm"
                disabled={busy || account === '' || data.length === 0}
              >
                <small>Deloy</small>
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Form>
        <Alert variant='danger' onClose={() => setError0('')} dismissible hidden={error0===''}>
          <small>{error0}</small>
        </Alert>
        <p className="text-center"><small>OR</small></p>
        <InputGroup className="mb-3">
          <FormControl
            value={contractAdr1}
            placeholder="contract address"
            onChange={(e) => {setContractAdr1(e.target.value)}}
            size="sm"
          />
          <InputGroup.Append>
            <OverlayTrigger
              placement="left"
              overlay={<Tooltip>Use deployed Contract address</Tooltip>}
            >
              <Button
                variant="primary"
                size="sm"
                disabled={busy || account === '' || data.length === 0}
                onClick={()=>{addSmartContracts(contractAdr1)}}
              >
                <small>At Address</small>
              </Button>
            </OverlayTrigger>
          </InputGroup.Append>
        </InputGroup>
        <hr />
        <p className="text-center"><small>Deployed Contracts</small></p>
        <Alert variant='warning' hidden={smartContracts.length>0}>
          <small>{error1}</small>
        </Alert>
        <SmartContractsList smartContracts={smartContracts} network={network} celo={celo} removeContract={removeContract} />
      </Container>
    </div>
  )
}

export default App
