/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import { set, merge } from 'lodash'

import { Alert, Form, Input, Loading } from '@kube-design/components'
import { Modal } from 'components/Base'
import { NumberInput } from 'components/Inputs'

import styles from './index.scss'

@observer
export default class HPAModal extends React.Component {
  static propTypes = {
    visible: PropTypes.bool,
    store: PropTypes.object,
    detail: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
  }

  static defaultProps = {
    visible: false,
    store: {},
    detail: {},
    onOk() {},
    onCancel() {},
  }

  constructor(props) {
    super(props)

    this.form = React.createRef()

    this.state = {
      loading: true,
      formData: undefined,
    }

    this.store = props.store
  }

  componentDidMount() {
    this.fetchData(this.props)
  }

  fetchData = params => {
    const { namespace, cluster, annotations = {} } = params.detail
    const name = annotations['kubesphere.io/relatedHPA'] || params.detail.name
    const _params = { name, cluster, namespace }

    this.setState({ loading: true }, () => {
      this.store.checkName(_params).then(resp => {
        this.isEdit = resp.exist

        if (resp.exist) {
          this.store.fetchDetail(_params).then(() => {
            this.setState({ loading: false, formData: this.getFormData() })
          })
        } else {
          this.setState({ loading: false, formData: this.getFormData() })
        }
      })
    })
  }

  getFormData = () => {
    const { name, namespace } = this.props.detail
    const detail = toJS(this.store.detail)

    const {
      cpuCurrentUtilization,
      cpuTargetUtilization,
      memoryCurrentValue,
      memoryTargetValue,
    } = detail

    return merge({}, detail._originData, {
      metadata: {
        name,
        namespace,
        annotations: {
          cpuCurrentUtilization,
          cpuTargetUtilization,
          memoryCurrentValue,
          memoryTargetValue,
        },
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name,
        },
      },
    })
  }

  handleOk = () => {
    const form = this.form.current

    form &&
      form.validate(() => {
        const formData = form.getData()

        if (this.isEdit) {
          set(formData, 'metadata.resourceVersion', null)
        }

        this.props.onOk(formData, this.isEdit)
      })
  }

  render() {
    const { visible, onCancel } = this.props
    const { isSubmitting } = this.store
    const { formData, loading } = this.state

    return (
      <Modal
        width={691}
        title={t('Horizontal Pod Autoscaling')}
        icon="firewall"
        onOk={this.handleOk}
        onCancel={onCancel}
        visible={visible}
        isSubmitting={isSubmitting}
      >
        <Loading spinning={loading}>
          <Form data={formData} ref={this.form}>
            <Alert
              className={styles.alert}
              type="info"
              message={t('HPA_MSG')}
            />
            <Form.Item
              label={t('Resource Name')}
              rules={[{ required: true, message: t('NAME_EMPTY_DESC') }]}
            >
              <Input name="metadata.name" disabled />
            </Form.Item>
            <Form.Item
              label={`${t('CPU Target Utilization')} (${t('Unit')}: %)`}
              desc={t('CPU_REQUEST_TARGET_DESC')}
            >
              <NumberInput
                name="metadata.annotations.cpuTargetUtilization"
                interger
                min={0}
                max={100}
                defaultValue=""
                onChange={this.handleCPUChange}
              />
            </Form.Item>
            <Form.Item
              label={`${t('Memory Target Usage')} (${t('Unit')}: Mi)`}
              desc={t('MEMORY_REQUEST_TARGET_DESC')}
            >
              <NumberInput
                name="metadata.annotations.memoryTargetValue"
                interger
                unit="Mi"
                min={0}
                defaultValue=""
                onChange={this.handleMemoryChange}
              />
            </Form.Item>
            <Form.Item
              label={t('Min Replicas Number')}
              desc={t('MIN_REPLICAS_DESC')}
            >
              <NumberInput
                name="spec.minReplicas"
                placeholder={t('REPLICAS_PLACEHOLDER')}
                min={1}
                integer
                defaultValue={1}
              />
            </Form.Item>
            <Form.Item
              label={t('Max Replicas Number')}
              desc={t('MAX_REPLICAS_DESC')}
            >
              <NumberInput
                name="spec.maxReplicas"
                placeholder={t('REPLICAS_PLACEHOLDER')}
                min={1}
                integer
                defaultValue={1}
              />
            </Form.Item>
          </Form>
        </Loading>
      </Modal>
    )
  }
}
