// Copyright 2022 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Card, Col, Divider, Progress, Row, Spin} from "antd";
import * as SystemBackend from "./backend/SystemInfo";
import React from "react";
import * as Setting from "./Setting";
import i18next from "i18next";

class SystemInfo extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cpuUsage: [],
      memUsed: 0,
      memTotal: 0,
      latestVersion: undefined,
      intervalId: null,
      href: "",
      loading: true,
    };
  }

  UNSAFE_componentWillMount() {
    SystemBackend.getSystemInfo(this.props.account?.owner, this.props.account?.name).then(res => {
      this.setState({
        cpuUsage: res.cpu_usage,
        memUsed: res.memory_used,
        memTotal: res.memory_total,
        loading: false,
      });

      const id = setInterval(() => {
        SystemBackend.getSystemInfo(this.props.account?.owner, this.props.account?.name).then(res => {
          this.setState({
            cpuUsage: res.cpu_usage,
            memUsed: res.memory_used,
            memTotal: res.memory_total,
          });
        }).catch(error => {
          Setting.showMessage("error", `System info failed to get: ${error}`);
        });
      }, 1000 * 3);
      this.setState({intervalId: id});
    }).catch(error => {
      Setting.showMessage("error", `System info failed to get: ${error}`);
    });

    SystemBackend.getGitHubLatestReleaseVersion().then(res => {
      const href = res && res.length >= 8 ? `https://github.com/casdoor/casdoor/commit/${res}` : "";
      const versionText = res && res.length >= 8 ? res.substring(0, 8) : i18next.t("system:Unknown Version");
      this.setState({latestVersion: versionText, href: href});
    }).catch(err => {
      Setting.showMessage("error", `get latest commit version failed: ${err}`);
    });
  }

  componentWillUnmount() {
    if (this.state.intervalId !== null) {
      clearInterval(this.state.intervalId);
    }
  }

  render() {
    const CPUInfo = this.state.cpuUsage?.length > 0 ?
      this.state.cpuUsage.map((usage, i) => {
        return (
          <Progress key={i} percent={Number(usage.toFixed(1))} />
        );
      }) : i18next.t("system:Get CPU Usage Failed");

    const MemInfo = (
      this.state.memUsed && this.state.memTotal && this.state.memTotal !== 0 ?
        <div>
          {Setting.getFriendlyFileSize(this.state.memUsed)} / {Setting.getFriendlyFileSize(this.state.memTotal)}
          <br /> <br />
          <Progress type="circle" percent={Number((Number(this.state.memUsed) / Number(this.state.memTotal) * 100).toFixed(2))} />
        </div> : i18next.t("system:Get Memory Usage Failed")
    );

    return (
      <Row>
        <Col span={6}></Col>
        <Col span={12}>
          <Row gutter={[10, 10]}>
            <Col span={12}>
              <Card title={i18next.t("system:CPU Usage")} bordered={true} style={{textAlign: "center"}}>
                {this.state.loading ? <Spin size="large" /> : CPUInfo}
              </Card>
            </Col>
            <Col span={12}>
              <Card title={i18next.t("system:Memory Usage")} bordered={true} style={{textAlign: "center"}}>
                {this.state.loading ? <Spin size="large" /> : MemInfo}
              </Card>
            </Col>
          </Row>
          <Divider />
          <Card title={i18next.t("system:About Casdoor")} bordered={true} style={{textAlign: "center"}}>
            <div>{i18next.t("system:An Identity and Access Management (IAM) / Single-Sign-On (SSO) platform with web UI supporting OAuth 2.0, OIDC, SAML and CAS")}</div>
            GitHub: <a href="https://github.com/casdoor/casdoor">casdoor</a>
            <br />
            {i18next.t("system:Version")}: <a href={this.state.href}>{this.state.latestVersion}</a>
            <br />
            {i18next.t("system:Official Website")}: <a href="https://casdoor.org/">casdoor.org</a>
            <br />
            {i18next.t("system:Community")}: <a href="https://casdoor.org/#:~:text=Casdoor%20API-,Community,-GitHub">contact us</a>
          </Card>
        </Col>
        <Col span={6}></Col>
      </Row>
    );
  }
}

export default SystemInfo;
