import React from 'react'
import { Button, Container, Form } from 'react-bootstrap'
import { createIframeClient } from "@remixproject/plugin"

function App() {
  const [client, setClient] = React.useState(null)
  const [language, setLanguage] = React.useState('')
  const [fileName, setFileName] = React.useState('')
  const [data, setData] = React.useState([])
  const [constructor, setConstructor] = React.useState([])

  const [account, setAccount] = React.useState('')
  const [network, setNetwork] = React.useState('Mainnet')
  const [contract, setContract] = React.useState('')

  React.useEffect(() => {
    async function init () {
      if (!client) {
        setClient(createIframeClient())
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
      }
    }
    // TODO: celo & web3 init
    init()
  })

  function deploy() {
    // TODO: deploy
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
          {parm.name}
        </Form.Text>
        <Form.Control type="text" placeholder={parm.name} onChange={parm.onChange} />
      </Form.Group>))
    return (
      <Form>
        <Contracts contracts={data} fileName={fileName} />
        { items }
      </Form>
    )
  }

  function handelContract(e) {
    const name = e.target.value.replace(` - ${fileName}`, '')
    setContract(name)
    getConstructor(data[name])
  }

  function Networks() {
    const list = {
      Mainnet: { provider: 'https://rc1-forno.celo-testnet.org', blockscout: 'https://explorer.celo.org' },
      Baklava: { provider: 'https://baklava-forno.celo-testnet.org', blockscout: 'https://baklava-blockscout.celo-testnet.org' },
      Alfajores: { provider: 'https://alfajores-forno.celo-testnet.org', blockscout: 'https://alfajores-blockscout.celo-testnet.org' }
    }
    const items = Object.keys(list).map((key) => <option key={key}>{key}</option> )
    return (
      <Form.Group>
        <Form.Text className="text-muted">NETWORK</Form.Text>
        <Form.Control as="select" value={network} onChange={(e) => setNetwork(e.target.value)}>
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
        <Form.Text className="text-muted">CONTRACT</Form.Text>
        <Form.Control as="select" value={contract} onChange={handelContract}>
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
            <Form.Text className="text-muted">LANGUAGE</Form.Text>
            <Form.Control type="text" placeholder="Language" value={language} readOnly />
          </Form.Group>
          <Form.Group>
            <Form.Text className="text-muted">FILE NAME</Form.Text>
            <Form.Control type="text" placeholder="File Name" value={fileName} readOnly />
          </Form.Group>
          <hr />
          <Form.Group>
            <Form.Text className="text-muted">ACCOUNT</Form.Text>
            <Form.Control type="text" placeholder="Account" value={account} readOnly />
          </Form.Group>
          <Networks />
        </Form>
        <hr />
        <MethodParmsForm parms={constructor} />
        <Button variant="outline-primary" block onClick={deploy}>Deploy</Button>
      </Container>
    </div>
  )
}

export default App
