import React, { useState, useEffect } from "react"
import { connect } from "react-redux"
import { get } from "automate-redux";
import jwt from "jsonwebtoken"
import service from "../../index";
import * as templates from "./templates.js"
import { SPACE_CLOUD_USER_ID } from "../../constants"

import Sidenav from '../../components/sidenav/Sidenav';
import Topbar from '../../components/topbar/Topbar';
import Header from '../../components/header/Header';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { Checkbox, Input, Select, Button, Tooltip, Icon, Tag } from 'antd';
import 'codemirror/theme/material.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/edit/closebrackets.js'
import "./explorer.css"
import { notify } from "../../utils";

const { Option } = Select;


const generateAdminToken = (secret) => {
  return jwt.sign({ id: SPACE_CLOUD_USER_ID }, secret)
}

const Explorer = (props) => {
  const [value, setValue] = useState(templates.defaultTemplate)
  const [useAdminToken, setUseAdminToken] = useState(true)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(null)
  const [response, setResponse] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState()


  useEffect(() => {
    if (useAdminToken && props.secret) {
      setToken(generateAdminToken(props.secret))
    } else {
      setToken(null)
    }
  }, [useAdminToken, props.secret])

  useEffect(() => {
    if (selectedTemplate) {
      console.log(selectedTemplate)
      setValue(templates[selectedTemplate + "Template"])
    }
  }, [selectedTemplate])

  const applyRequest = () => {
    let code = value
    if (code.includes("db.beginBatch") || code.includes("uploadFile") || code.includes("api.Service") || code.includes("liveQuery")) {
      notify("info", "Not supported", "Explorer does not support all APIs provided by Space Cloud. It supports only basic CRUD operations and function calls.")
      return
    }

    setLoading(true)
    service.execSpaceAPI(props.projectId, code, token).then(res => {
      setResponse(res)
    })
      .catch(ex => {
        setResponse(null)
        notify("error", "Something went wrong", ex)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="explorer">
      <Topbar showProjectSelector />
      <div className="flex-box">
        <Sidenav selectedItem="explorer" />
        <div className="page-content">
          <div className="header-flex">
            <Header name="Explorer" color="#000" fontSize="22px" />
          </div>
          <div className="row">
            Trigger requests to Space Cloud directly by coding below. No need to setup any frontend project.
            (Note: Only javascript code is allowed below.) The <code>api</code> object is available in all requests.
          </div>
          <div className="row">
            <Checkbox
              checked={useAdminToken}
              onChange={e => setUseAdminToken(e.target.checked)}
            >
              Use admin token
            </Checkbox>
            <Tooltip placement="bottomLeft" title="Use an admin token generated by Space Cloud to bypass all security rules for this request ">
              <Icon type="info-circle" style={{ color: 'rgba(0,0,0,.45)' }} />
            </Tooltip>
          </div>
          {!useAdminToken && <div className="row">
            <Input.Password placeholder="Token to authorize request" value={token} onChange={e => setToken(e.target.value)} />
          </div>}
          <div className="row">
            <CodeMirror
              value={value}
              options={{
                mode: { name: "javascript", json: true },
                lineNumbers: true,
                styleActiveLine: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                tabSize: 2,
                autofocus: true
              }}
              onBeforeChange={(editor, data, value) => {
                setValue(value)
              }}
            />
          </div>
          <div className="row apply-container">
            <Select value={selectedTemplate} style={{ minWidth: "240px" }} showSerach={true} onChange={setSelectedTemplate} placeholder="Pick a Template">
              <Option value="insert">Insert Document</Option>
              <Option value="get">Get documents</Option>
              <Option value="call">Call a function</Option>
            </Select>
            <Button type="primary" onClick={applyRequest} loading={loading}>
              Apply
          </Button>
          </div>
          {loading === false && response && <div className="row">
            <h3>Status: <Tag color={response.status === 200 ? "#4F8A10" : "#D8000C"}>{response.status}</Tag></h3>
            <h3>Result: </h3>
            <div className="result">
              <CodeMirror
                value={JSON.stringify(response.data, null, 2)}
                options={{
                  mode: { name: "javascript", json: true },
                  tabSize: 2,
                  readOnly: true
                }}
              />
            </div>
          </div>}
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    secret: get(state, "config.secret"),
    projectId: get(state, "config.id")
  }
}

export default connect(mapStateToProps)(Explorer)