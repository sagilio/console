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

import { get, isFunction, cloneDeep, isArray } from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { Notify } from '@kube-design/components'
import { Modal, Switch } from 'components/Base'
import Form from './Form'
import Code from './Code'

import styles from './index.scss'

export default class CreateModal extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    name: PropTypes.string,
    module: PropTypes.string,
    steps: PropTypes.array,
    store: PropTypes.object,
    formTemplate: PropTypes.object,
    visible: PropTypes.bool,
    okBtnText: PropTypes.string, // not requried
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    noCodeEdit: PropTypes.bool,
    isSubmitting: PropTypes.bool,
  }

  static defaultProps = {
    visible: false,
    noCodeEdit: false,
    isSubmitting: false,
    onOk() {},
    onCancel() {},
  }

  constructor(props) {
    super(props)

    this.state = {
      formTemplate: cloneDeep(props.formTemplate),
      isCodeMode: props.onlyCode || false,
      currentStep: 0,
    }

    this.codeRef = React.createRef()
    this.formRef = React.createRef()
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible !== prevProps.visible) {
      if (this.props.visible) {
        this.setState({
          currentStep: 0,
          isCodeMode: this.props.onlyCode || false,
          formTemplate: cloneDeep(this.props.formTemplate),
        })
      }
    }
  }

  getFormDataFromCode = code =>
    isArray(code)
      ? code.reduce(
          (prev, cur) => ({
            ...prev,
            [cur.kind.replace('Federated', '')]: cur,
          }),
          {}
        )
      : code

  handleModeChange = () => {
    this.setState(({ isCodeMode, formTemplate }) => {
      const newState = { formTemplate, isCodeMode: !isCodeMode }

      if (
        !isCodeMode &&
        isFunction(get(this, 'formRef.current.hasSubRoute')) &&
        this.formRef.current.hasSubRoute()
      ) {
        return Notify.warning(t('SAVE_FORM_TIP'))
      }

      if (
        !isCodeMode &&
        isFunction(get(this, 'formRef.current.getCurrentStep'))
      ) {
        newState.currentStep = this.formRef.current.getCurrentStep()
      }

      if (isCodeMode && isFunction(get(this, 'codeRef.current.getData'))) {
        newState.formTemplate = this.getFormDataFromCode(
          this.codeRef.current.getData()
        )
      }

      return newState
    })
  }

  handleCode = data => {
    const { onOk } = this.props
    onOk(this.getFormDataFromCode(data))
  }

  renderForms() {
    const { formTemplate, currentStep } = this.state

    return (
      <Form
        {...this.props}
        ref={this.formRef}
        formTemplate={formTemplate}
        currentStep={currentStep}
      />
    )
  }

  renderCodeEditor() {
    const { onCancel, isSubmitting } = this.props
    const { formTemplate } = this.state
    return (
      <Code
        ref={this.codeRef}
        formTemplate={formTemplate}
        onOk={this.handleCode}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
      />
    )
  }

  renderOperations() {
    const { noCodeEdit, onlyCode } = this.props
    const { isCodeMode } = this.state

    if (noCodeEdit || onlyCode) {
      return null
    }

    return (
      <Switch
        className={styles.switch}
        text={t('EDIT_YAML')}
        onChange={this.handleModeChange}
        checked={isCodeMode}
      />
    )
  }

  render() {
    const { name, width, visible, onCancel, noCodeEdit, ...rest } = this.props
    const { isCodeMode } = this.state

    const title = this.props.title || t('CREATE_NAME', { name: t(name) })

    return (
      <Modal
        width={width || 960}
        title={title}
        bodyClassName={styles.body}
        onCancel={onCancel}
        visible={visible}
        {...rest}
        operations={this.renderOperations()}
        hideFooter
      >
        {!noCodeEdit && isCodeMode
          ? this.renderCodeEditor()
          : this.renderForms()}
      </Modal>
    )
  }
}
