import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import {
  AuthgearFlowCreateResponseResultData,
  AuthgearFlowResponse,
  AuthgearFlowResponseResultData,
  AuthgearFlowStepIdentificationType,
  createLoginFlow,
  createSignupFlow,
  executeFlowAuthenticateWithOTP,
  executeFlowIdentifyWithEmail,
  executeFlowIdentifyWithPhone,
  executeFlowRequestOTPViaEmail,
  executeFlowRequestResendOTPViaEmail,
  executeLoginCodeFlowAuthenticateWithPassword,
  executeLoginFlowAuthenticateWith2FA,
  executeLoginFlowRequentOTPViaSMS,
  executeSignupFlowAuthenticateWith2FA,
  executeSignupFlowAuthenticateWithPassword,
  executeSignupFlowRequentOTPViaSMS,
  executeSignupFlowRequest2FA,
} from './api'

import Button from './Button'
import InputField from './InputField'

/// Flow Step

const enum FlowStep {
  Done = 'Done',
  Error = 'Error',
  Login = 'Login',
  LoginAuthenticateRequestOTPViaEmail = 'LoginAuthenticateRequestOTPViaEmail',
  LoginAuthenticateRequestOTPViaSMS = 'LoginAuthenticateRequestOTPViaSMS',
  LoginAuthenticateWith2FA = 'LoginAuthenticateWith2FA',
  LoginAuthenticateWithOTP = 'LoginAuthenticateWithOTP',
  LoginAuthenticateWithPassword = 'LoginAuthenticateWithPassword',
  Signup = 'Signup',
  SignupAuthenticateRequest2FA = 'SignupAuthenticateRequest2FA',
  SignupAuthenticateRequestOTPViaEmail = 'SignupAuthenticateRequestOTPViaEmail',
  SignupAuthenticateRequestOTPViaSMS = 'SignupAuthenticateRequestOTPViaSMS',
  SignupAuthenticateWith2FA = 'SignupAuthenticateWith2FA',
  SignupAuthenticateWithOTP = 'SignupAuthenticateWithOTP',
  SignupAuthenticateWithPassword = 'SignupAuthenticateWithPassword',
}

/// Flow Step Type

interface FlowStepTypeBuilder<
  T extends FlowStep,
  Next extends FlowStep,
  Input extends FlowStepInput,
  Output extends FlowStepOutput
> {
  step: T
  input: Input
  output: Output
  targets: Next | FlowStep.Done | FlowStep.Error
}

type FlowStepTypes =
  | FlowStepTypeBuilder<
      FlowStep.Done,
      FlowStep.Done,
      FlowStepInput,
      FlowStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.Error,
      FlowStep.Error,
      FlowErrorStepInput,
      FlowErrorStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.Login,
      | FlowStep.LoginAuthenticateRequestOTPViaEmail
      | FlowStep.LoginAuthenticateRequestOTPViaSMS
      | FlowStep.LoginAuthenticateWithPassword,
      FlowLoginStepInput,
      FlowLoginStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.LoginAuthenticateRequestOTPViaEmail,
      FlowStep.LoginAuthenticateWithOTP,
      FlowLoginRequestOTPStepInput,
      FlowLoginRequestOTPStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.LoginAuthenticateRequestOTPViaSMS,
      FlowStep.LoginAuthenticateWithOTP,
      FlowLoginRequestOTPStepInput,
      FlowLoginRequestOTPStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.LoginAuthenticateWith2FA,
      FlowStep.Done | FlowStep.Error,
      FlowStepInput,
      FlowLoginWith2FAStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.LoginAuthenticateWithOTP,
      | FlowStep.LoginAuthenticateWithOTP
      | FlowStep.LoginAuthenticateWith2FA
      | FlowStep.Done
      | FlowStep.Error,
      FlowLoginAuthenticateWithOTPSetpInput,
      FlowLoginWithOTPStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.LoginAuthenticateWithPassword,
      FlowStep.LoginAuthenticateWith2FA,
      FlowStepInput,
      FlowLoginWithPasswordStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.Signup,
      | FlowStep.SignupAuthenticateRequestOTPViaEmail
      | FlowStep.SignupAuthenticateRequestOTPViaSMS
      | FlowStep.SignupAuthenticateWithPassword,
      FlowSignupStepInput,
      FlowSignupStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.SignupAuthenticateRequest2FA,
      FlowStep.SignupAuthenticateWith2FA,
      FlowStepInput,
      FlowStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.SignupAuthenticateRequestOTPViaEmail,
      FlowStep.SignupAuthenticateWithOTP,
      FlowSignupRequestOTPStepInput,
      FlowSignupRequestOTPStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.SignupAuthenticateRequestOTPViaSMS,
      FlowStep.SignupAuthenticateWithOTP,
      FlowSignupRequestOTPStepInput,
      FlowSignupRequestOTPStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.SignupAuthenticateWith2FA,
      FlowStep.Done,
      FlowSignupWith2FAStepInput,
      FlowSignupWith2FAStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.SignupAuthenticateWithOTP,
      | FlowStep.SignupAuthenticateWithOTP
      | FlowStep.SignupAuthenticateRequest2FA,
      FlowSignupAuthenticateWithOTPSetpInput,
      FlowSignupWithOTPStepOutput
    >
  | FlowStepTypeBuilder<
      FlowStep.SignupAuthenticateWithPassword,
      FlowStep.SignupAuthenticateRequest2FA,
      FlowStepInput,
      FlowSignupWithPasswordStepOutput
    >

type FlowStepInputTyper<T> = Extract<FlowStepTypes, { step: T }>['input']
type FlowStepOutputTyper<T> = Extract<FlowStepTypes, { step: T }>['output']
type FlowStepTargetsTyper<T> = Extract<FlowStepTypes, { step: T }>['targets']

/// Flow Executors

interface FlowStateTyper<T extends FlowStep> {
  id: string
  finished: boolean
  finishRedirectURI?: string
  step: T
  data: FlowStepInputTyper<T>
}

type FlowExecutorReturnType<T extends FlowStep> = {
  [K in FlowStepTargetsTyper<T>]: FlowStateTyper<K>
}[FlowStepTargetsTyper<T>]

type FlowExecutor<T extends FlowStep> = (
  flowId: string,
  input: FlowStepOutputTyper<T>
) => Promise<FlowExecutorReturnType<T>>

type FlowExecutorRecord = { [K in FlowStep]: FlowExecutor<K> }

function makeFlowResponse<T extends FlowStep>(
  step: T,
  response: AuthgearFlowResponse<AuthgearFlowResponseResultData>,
  state: FlowStepInputTyper<T>
): FlowStateTyper<T> {
  return {
    id: response.result.id,
    finished: response.result.finished ?? false,
    finishRedirectURI: response.result.data.finish_redirect_uri,
    step,
    data: state,
  }
}

function makeFlowDoneResponse(): FlowStateTyper<FlowStep.Done> {
  return makeFlowResponse(
    FlowStep.Done,
    {
      result: {
        id: '',
        data: {},
        json_schema: {
          type: 'object',
        },
        finished: true,
      },
    },
    {}
  )
}

function makeFlowErrorResponse(error?: Error): FlowStateTyper<FlowStep.Error> {
  return makeFlowResponse(
    FlowStep.Error,
    {
      result: {
        id: '',
        data: {},
        json_schema: {
          type: 'object',
        },
        finished: false,
      },
    },
    { error }
  )
}

const flows: FlowExecutorRecord = {
  [FlowStep.Done]: () => Promise.resolve(makeFlowDoneResponse()),
  [FlowStep.Error]: () => Promise.resolve(makeFlowErrorResponse()),
  [FlowStep.Login]: async (flowId, input) => {
    const api =
      input.type == 'phone'
        ? executeFlowIdentifyWithPhone
        : executeFlowIdentifyWithEmail
    const response = await api(flowId, input.loginId)

    const candidates = response.result.data.candidates?.map(
      (candidate, index) => {
        switch (candidate.authentication) {
          case 'primary_oob_otp_email':
            return makeFlowResponse(
              FlowStep.LoginAuthenticateRequestOTPViaEmail,
              response,
              { displayName: candidate.masked_display_name, index }
            )
          case 'primary_oob_otp_sms':
            return makeFlowResponse(
              FlowStep.LoginAuthenticateRequestOTPViaSMS,
              response,
              { displayName: candidate.masked_display_name, index }
            )
          case 'primary_password':
            if (candidate.count > 0) {
              return makeFlowResponse(
                FlowStep.LoginAuthenticateWithPassword,
                response,
                { index }
              )
            }
        }
        return makeFlowErrorResponse()
      }
    )

    return [...(candidates ?? []), makeFlowErrorResponse()][0]
  },
  [FlowStep.LoginAuthenticateRequestOTPViaEmail]: async (flowId, input) => {
    const response = await executeFlowRequestOTPViaEmail(flowId, input.index)
    return makeFlowResponse(FlowStep.LoginAuthenticateWithOTP, response, {
      canResendAt: new Date(response.result.data.can_resend_at),
      displayName: response.result.data.masked_claim_value,
    })
  },
  [FlowStep.LoginAuthenticateRequestOTPViaSMS]: async (flowId, input) => {
    const response = await executeLoginFlowRequentOTPViaSMS(flowId, input.index)
    return makeFlowResponse(FlowStep.LoginAuthenticateWithOTP, response, {
      canResendAt: new Date(response.result.data.can_resend_at),
      displayName: response.result.data.masked_claim_value,
    })
  },
  [FlowStep.LoginAuthenticateWith2FA]: async (flowId, input) => {
    const response = await executeLoginFlowAuthenticateWith2FA(
      flowId,
      input.code
    )
    return response.error ? makeFlowErrorResponse() : makeFlowDoneResponse()
  },
  [FlowStep.LoginAuthenticateWithOTP]: async (flowId, input) => {
    if (input.resend) {
      const response = await executeFlowRequestResendOTPViaEmail(flowId)
      return makeFlowResponse(FlowStep.LoginAuthenticateWithOTP, response, {
        canResendAt: new Date(response.result.data.can_resend_at),
        displayName: response.result.data.masked_claim_value,
      })
    }
    if (input.code) {
      const response = await executeFlowAuthenticateWithOTP(flowId, input.code)

      const candidates = response.result.data.candidates?.map((candidate) => {
        switch (candidate.authentication) {
          case 'secondary_totp':
            return makeFlowResponse(
              FlowStep.LoginAuthenticateWith2FA,
              response,
              {}
            )
        }
        return makeFlowErrorResponse()
      })

      return [...(candidates ?? []), makeFlowErrorResponse()][0]
    }
    return makeFlowErrorResponse()
  },
  [FlowStep.LoginAuthenticateWithPassword]: async (flowId, input) => {
    const response = await executeLoginCodeFlowAuthenticateWithPassword(
      flowId,
      input.password
    )

    const candidates = response.result.data.candidates.map((candidate) => {
      switch (candidate.authentication) {
        case 'secondary_totp':
          return makeFlowResponse(
            FlowStep.LoginAuthenticateWith2FA,
            response,
            {}
          )
      }
      return makeFlowErrorResponse()
    })

    return [...candidates, makeFlowErrorResponse()][0]
  },
  [FlowStep.Signup]: async (flowId, input) => {
    const api =
      input.type == 'phone'
        ? executeFlowIdentifyWithPhone
        : executeFlowIdentifyWithEmail
    const response = await api(flowId, input.loginId)

    const candidates = response.result.json_schema.oneOf?.map((candidate) => {
      switch (candidate.properties?.authentication?.const) {
        case 'primary_oob_otp_email':
          return makeFlowResponse(
            FlowStep.SignupAuthenticateRequestOTPViaEmail,
            response,
            {
              displayName: input.loginId,
              index: Number.parseInt(
                candidate.properties.index?.const?.toString() ?? '0'
              ),
            }
          )
        case 'primary_oob_otp_sms':
          return makeFlowResponse(
            FlowStep.SignupAuthenticateRequestOTPViaSMS,
            response,
            {
              displayName: input.loginId,
              index: Number.parseInt(
                candidate.properties.index?.const?.toString() ?? '0'
              ),
            }
          )
        case 'primary_password':
          return makeFlowResponse(
            FlowStep.SignupAuthenticateWithPassword,
            response,
            {}
          )
      }
      return makeFlowErrorResponse()
    })

    return [...(candidates ?? []), makeFlowErrorResponse()][0]
  },
  [FlowStep.SignupAuthenticateRequest2FA]: async (flowId) => {
    const response = await executeSignupFlowRequest2FA(flowId)
    return makeFlowResponse(FlowStep.SignupAuthenticateWith2FA, response, {
      secret: response.result.data.secret,
    })
  },
  [FlowStep.SignupAuthenticateRequestOTPViaEmail]: async (flowId) => {
    const response = await executeFlowRequestOTPViaEmail(flowId, 0)
    return makeFlowResponse(FlowStep.SignupAuthenticateWithOTP, response, {
      canResendAt: new Date(response.result.data.can_resend_at),
      displayName: response.result.data.masked_claim_value,
    })
  },
  [FlowStep.SignupAuthenticateRequestOTPViaSMS]: async (flowId) => {
    const response = await executeSignupFlowRequentOTPViaSMS(flowId)
    return makeFlowResponse(FlowStep.SignupAuthenticateWithOTP, response, {
      canResendAt: new Date(response.result.data.can_resend_at),
      displayName: response.result.data.masked_claim_value,
    })
  },
  [FlowStep.SignupAuthenticateWith2FA]: async (flowId, input) => {
    const response = await executeSignupFlowAuthenticateWith2FA(
      flowId,
      input.code,
      input.displayName
    )
    return response.error ? makeFlowErrorResponse() : makeFlowDoneResponse()
  },
  [FlowStep.SignupAuthenticateWithOTP]: async (flowId, input) => {
    if (input.resend) {
      const response = await executeFlowRequestResendOTPViaEmail(flowId)
      return makeFlowResponse(FlowStep.SignupAuthenticateWithOTP, response, {
        canResendAt: new Date(response.result.data.can_resend_at),
        displayName: response.result.data.masked_claim_value,
      })
    }

    if (input.code) {
      const response = await executeFlowAuthenticateWithOTP(flowId, input.code)

      const candidates = response.result.json_schema.oneOf?.map((candidate) => {
        switch (candidate.properties?.authentication?.const) {
          case 'secondary_totp':
            return makeFlowResponse(
              FlowStep.SignupAuthenticateRequest2FA,
              response,
              {}
            )
        }
        return makeFlowErrorResponse()
      })

      return [...(candidates ?? []), makeFlowDoneResponse()][0]
    }

    return makeFlowErrorResponse()
  },
  [FlowStep.SignupAuthenticateWithPassword]: async (flowId, input) => {
    const response = await executeSignupFlowAuthenticateWithPassword(
      flowId,
      input.password
    )

    const candidates = response.result.json_schema.oneOf?.map((candidate) => {
      switch (candidate.properties?.authentication?.const) {
        case 'secondary_totp':
          return makeFlowResponse(
            FlowStep.SignupAuthenticateRequest2FA,
            response,
            {}
          )
      }
      return makeFlowErrorResponse()
    })

    return [...(candidates ?? []), makeFlowDoneResponse()][0]
  },
}

/// Step Input

interface FlowStepInput {}

interface FlowErrorStepInput extends FlowStepInput {
  error?: Error
}

interface FlowLoginStepInput extends FlowStepInput {
  allowEmail: boolean
  allowPhone: boolean
}

interface FlowLoginAuthenticateWithOTPSetpInput extends FlowStepInput {
  canResendAt: Date
  displayName: string
}

interface FlowLoginRequestOTPStepInput extends FlowStepInput {
  displayName: string
  index: number
}

interface FlowSignupStepInput extends FlowStepInput {
  allowEmail: boolean
  allowPhone: boolean
}

interface FlowSignupAuthenticateWithOTPSetpInput extends FlowStepInput {
  canResendAt: Date
  displayName: string
}

interface FlowSignupRequestOTPStepInput extends FlowStepInput {
  displayName: string
  index: number
}

interface FlowSignupWith2FAStepInput extends FlowStepInput {
  secret: string
}

/// Step Output

interface FlowStepOutput {}

interface FlowErrorStepOutput extends FlowStepOutput {
  error?: Error
}

interface FlowLoginStepOutput extends FlowStepOutput {
  type: AuthgearFlowStepIdentificationType
  loginId: string
}

interface FlowLoginRequestOTPStepOutput extends FlowStepOutput {
  index: number
}

interface FlowLoginWith2FAStepOutput extends FlowStepOutput {
  code: string
}

interface FlowLoginWithOTPStepOutput extends FlowStepOutput {
  code?: string
  resend?: boolean
}

interface FlowLoginWithPasswordStepOutput extends FlowStepOutput {
  password: string
}

interface FlowSignupStepOutput extends FlowStepOutput {
  type: AuthgearFlowStepIdentificationType
  loginId: string
}

interface FlowSignupRequestOTPStepOutput extends FlowStepOutput {
  index: number
}

interface FlowSignupWith2FAStepOutput extends FlowStepOutput {
  code: string
  displayName: string
}

interface FlowSignupWithOTPStepOutput extends FlowStepOutput {
  code?: string
  resend?: boolean
}

interface FlowSignupWithPasswordStepOutput extends FlowStepOutput {
  password: string
}

/// Shared

export interface FlowFormBaseProps<T extends FlowStep>
  extends React.PropsWithChildren {
  executeFlow: (
    data: { [K in T]: FlowStepOutputTyper<K> }[T],
    replace?: boolean
  ) => Promise<void>
  state: { [K in T]: FlowStateTyper<K> }[T] | null
}

/// FlowStepForm

export interface FlowStepFormProps extends FlowFormBaseProps<FlowStep> {
  defaultIdentityState?: FlowSignupStepInput
  resetFlow: (replace?: boolean) => void
}

function FlowStepForm({
  defaultIdentityState,
  executeFlow,
  resetFlow,
  state,
  ...props
}: FlowStepFormProps): JSX.Element {
  switch (state?.step) {
    case FlowStep.Done:
      return <p className="text-center">Done</p>
    case FlowStep.Error:
      return <p className="text-center">Unsupported</p>
    case FlowStep.Login:
    case FlowStep.Signup:
      return (
        <IdentityStepForm
          defaultIdentityState={defaultIdentityState}
          executeFlow={executeFlow}
          resetFlow={resetFlow}
          state={state}
          {...props}
        />
      )
    case FlowStep.LoginAuthenticateRequestOTPViaEmail:
    case FlowStep.LoginAuthenticateRequestOTPViaSMS:
    case FlowStep.SignupAuthenticateRequestOTPViaEmail:
    case FlowStep.SignupAuthenticateRequestOTPViaSMS:
      return (
        <OTPRequestStepForm
          executeFlow={executeFlow}
          state={state}
          {...props}
        />
      )
    case FlowStep.LoginAuthenticateWith2FA:
      return <TOTPStepForm executeFlow={executeFlow} state={state} {...props} />
    case FlowStep.LoginAuthenticateWithPassword:
    case FlowStep.SignupAuthenticateWithPassword:
      return (
        <PasswordStepForm executeFlow={executeFlow} state={state} {...props} />
      )
    case FlowStep.SignupAuthenticateWith2FA:
      return (
        <TOTPSetupStepForm executeFlow={executeFlow} state={state} {...props} />
      )
    case FlowStep.LoginAuthenticateWithOTP:
    case FlowStep.SignupAuthenticateWithOTP:
      return <OTPStepForm executeFlow={executeFlow} state={state} {...props} />
    case FlowStep.SignupAuthenticateRequest2FA:
      return (
        <TOTPRequestStepForm
          executeFlow={executeFlow}
          state={state}
          {...props}
        />
      )
    default:
      return (
        <IdentityStepForm
          defaultIdentityState={defaultIdentityState}
          executeFlow={executeFlow}
          resetFlow={resetFlow}
          state={null}
          {...props}
        />
      )
  }
}

/// IdentityStepForm

const enum IdentityType {
  EMAIL,
  PHONE,
}

export interface IdentityStepFormProps
  extends FlowFormBaseProps<FlowStep.Login | FlowStep.Signup> {
  defaultIdentityState?: FlowSignupStepInput
  resetFlow: (replace?: boolean) => void
}

function IdentityStepForm({
  defaultIdentityState,
  executeFlow,
  resetFlow,
  state,
  ...props
}: IdentityStepFormProps): JSX.Element {
  const [identity, setIdentity] = useState<string>('')
  const [identityType, setIdentityType] = useState<IdentityType>(
    state?.data.allowEmail
      ? IdentityType.EMAIL
      : state?.data.allowPhone
      ? IdentityType.PHONE
      : defaultIdentityState?.allowEmail
      ? IdentityType.EMAIL
      : defaultIdentityState?.allowPhone
      ? IdentityType.PHONE
      : IdentityType.EMAIL
  )

  const isUsingPhone = useMemo(
    () => identityType === IdentityType.PHONE,
    [identityType]
  )
  const shouldShowToggler = useMemo(
    () =>
      (state?.data.allowEmail && state.data.allowPhone) ||
      (defaultIdentityState &&
        defaultIdentityState.allowEmail &&
        defaultIdentityState.allowPhone),
    [defaultIdentityState, state]
  )

  const onIdentityChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIdentity(event.target.value)
      resetFlow()
    },
    [resetFlow]
  )
  const onIdentityToggled = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      setIdentity('')
      setIdentityType(isUsingPhone ? IdentityType.EMAIL : IdentityType.PHONE)
      resetFlow()
    },
    [isUsingPhone, resetFlow]
  )
  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({
        type: isUsingPhone ? 'phone' : 'email',
        loginId: identity,
      })
    },
    [executeFlow, isUsingPhone, identity]
  )

  return (
    <form onSubmit={onSubmitted} {...props}>
      <InputField
        className="mb-4"
        type={isUsingPhone ? 'text' : 'email'}
        label={isUsingPhone ? 'Phone Number' : 'Email'}
        onChange={onIdentityChanged}
        value={identity}
        required
      />
      {shouldShowToggler ? (
        <p className="mb-6 text-sm">
          <a href="#" onClick={onIdentityToggled}>
            {isUsingPhone ? 'Use email' : 'Use phone number'}
          </a>
        </p>
      ) : null}
      <Button type="submit">Continue</Button>
    </form>
  )
}

/// OTPRequestStepForm

export interface OTPRequestStepFormProps
  extends FlowFormBaseProps<
    | FlowStep.LoginAuthenticateRequestOTPViaEmail
    | FlowStep.LoginAuthenticateRequestOTPViaSMS
    | FlowStep.SignupAuthenticateRequestOTPViaEmail
    | FlowStep.SignupAuthenticateRequestOTPViaSMS
  > {}

function OTPRequestStepForm({
  executeFlow,
  state,
  ...props
}: OTPRequestStepFormProps): JSX.Element {
  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({ index: state?.data.index ?? 0 })
    },
    [executeFlow, state]
  )

  return (
    <form onSubmit={onSubmitted} {...props}>
      <Button type="submit">Send OTP to {state?.data.displayName}</Button>
    </form>
  )
}

/// OTPStepForm

export interface OTPStepFormProps
  extends FlowFormBaseProps<
    FlowStep.LoginAuthenticateWithOTP | FlowStep.SignupAuthenticateWithOTP
  > {}

function OTPStepForm({
  executeFlow,
  state,
  ...props
}: OTPStepFormProps): JSX.Element {
  const [canResendAt, setCanResendAt] = useState<Date>(new Date())
  const [resendSeconds, setResendSeconds] = useState<number>(0)
  const [otp, setOTP] = useState<string>('')

  const onOTPChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOTP(event.target.value)
    },
    []
  )
  const onResendOTPRequested = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      void executeFlow({ resend: true })
    },
    [executeFlow]
  )
  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({ code: otp })
    },
    [executeFlow, otp]
  )

  useEffect(() => {
    if (state) {
      setCanResendAt(state.data.canResendAt)
    }
  }, [state])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setResendSeconds(
        Math.round(Math.max(0, (canResendAt.getTime() - now.getTime()) / 1000))
      )
    }

    const interval = setInterval(tick, 1000)
    tick()

    return () => {
      clearInterval(interval)
    }
  }, [canResendAt])

  return (
    <form onSubmit={onSubmitted} {...props}>
      <InputField
        className="mb-6"
        type="text"
        label="OTP"
        onChange={onOTPChanged}
        value={otp}
        required
      />
      <p className="mb-4 text-sm">
        {resendSeconds > 0 ? (
          <a>
            Resend OTP to {state?.data.displayName} in {resendSeconds}s
          </a>
        ) : (
          <a href="#" onClick={onResendOTPRequested}>
            Resend OTP to {state?.data.displayName}
          </a>
        )}
      </p>
      <Button type="submit">Continue</Button>
    </form>
  )
}

/// PasswordStepForm

export interface PasswordStepFormProps extends FlowFormBaseProps<FlowStep> {}

function PasswordStepForm({
  executeFlow,
  ...props
}: PasswordStepFormProps): JSX.Element {
  const [password, setPassword] = useState<string>('')

  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({ password })
    },
    [executeFlow, password]
  )
  const onPasswordChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value)
    },
    []
  )

  return (
    <form onSubmit={onSubmitted} {...props}>
      <InputField
        className="mb-6"
        type="password"
        label="Password"
        onChange={onPasswordChanged}
        value={password}
        required
      />
      <Button type="submit">Continue</Button>
    </form>
  )
}

/// TOTPRequestStepForm

export interface TOTPRequestStepFormProps
  extends FlowFormBaseProps<FlowStep.SignupAuthenticateRequest2FA> {}

function TOTPRequestStepForm({
  executeFlow,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state,
  ...props
}: TOTPRequestStepFormProps): JSX.Element {
  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({})
    },
    [executeFlow]
  )

  return (
    <form onSubmit={onSubmitted} {...props}>
      <Button type="submit">Setup 2FA</Button>
    </form>
  )
}

/// TOTPSetupStepForm

export interface TOTPSetupStepFormProps
  extends FlowFormBaseProps<FlowStep.SignupAuthenticateWith2FA> {}

function TOTPSetupStepForm({
  executeFlow,
  state,
  ...props
}: TOTPSetupStepFormProps): JSX.Element {
  const [code, setCode] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')

  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({ code, displayName })
    },
    [code, displayName, executeFlow]
  )
  const onCodeChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCode(event.target.value)
    },
    []
  )
  const onDisplayNameChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayName(event.target.value)
    },
    []
  )

  return (
    <form onSubmit={onSubmitted} {...props}>
      <p>2FA Secret: {state?.data.secret}</p>
      <InputField
        className="mb-6"
        type="text"
        label="Display Name"
        onChange={onDisplayNameChanged}
        value={displayName}
        required
      />
      <InputField
        className="mb-6"
        type="text"
        label="TOTP"
        onChange={onCodeChanged}
        value={code}
        required
      />
      <Button type="submit">Continue</Button>
    </form>
  )
}

/// TOTPStepForm

export interface TOTPStepFormProps
  extends FlowFormBaseProps<FlowStep.LoginAuthenticateWith2FA> {}

function TOTPStepForm({
  executeFlow,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state,
  ...props
}: TOTPStepFormProps): JSX.Element {
  const [code, setCode] = useState<string>('')

  const onSubmitted = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void executeFlow({ code })
    },
    [code, executeFlow]
  )
  const onCodeChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCode(event.target.value)
    },
    []
  )

  return (
    <form onSubmit={onSubmitted} {...props}>
      <InputField
        className="mb-6"
        type="text"
        label="TOTP"
        onChange={onCodeChanged}
        value={code}
        required
      />
      <Button type="submit">Continue</Button>
    </form>
  )
}

/// FlowForm

type FlowState = { [K in FlowStep]: FlowStateTyper<K> }[FlowStep]

function isFlowState(input: unknown): input is FlowState {
  const state = input as FlowState | null
  return (
    state !== null &&
    typeof state.id === 'string' &&
    'step' in state &&
    'data' in state
  )
}

async function createFlow(type: FlowType, query: string): Promise<FlowState> {
  switch (type) {
    case 'login': {
      const response = await createLoginFlow(query)
      return makeCreateFlowStepState(FlowStep.Login, response)
    }
    case 'signup': {
      const response = await createSignupFlow(query)
      return makeCreateFlowStepState(FlowStep.Signup, response)
    }
  }
}

function makeCreateFlowStepState(
  initialStep: FlowStep.Login | FlowStep.Signup,
  response: AuthgearFlowResponse<AuthgearFlowCreateResponseResultData>
): FlowStateTyper<FlowStep.Login> | FlowStateTyper<FlowStep.Signup> {
  const state = { allowEmail: false, allowPhone: false }

  response.result.json_schema.oneOf?.forEach((candidate) => {
    switch (candidate.properties?.identification?.const) {
      case 'email':
        state.allowEmail = true
        break
      case 'phone':
        state.allowPhone = true
        break
    }
  })

  return {
    id: response.result.id,
    step: initialStep,
    data: state,
    finished: false,
  }
}

async function runFlowStep<T extends FlowStep>(
  state: FlowState,
  data: FlowStepOutput
): Promise<FlowState> {
  return await Promise.resolve(state as FlowStateTyper<T>)
    .then((state) => {
      console.debug('old state', state)
      return flows[state.step]
    })
    .then((flow) => flow(state.id, data as FlowStepOutputTyper<T>))
    .then((state) => {
      console.debug('new state', state)
      return state as FlowState
    })
}

export type FlowType = 'login' | 'signup'

export interface FlowFormProps extends React.PropsWithChildren {
  defaultIdentityState?: FlowSignupStepInput
  to: string
  type: FlowType
}

export default function FlowForm({
  defaultIdentityState,
  to,
  type,
  ...props
}: FlowFormProps): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  const [state, setState] = useState<FlowState | null>(null)

  const onExecuteFlow = useCallback(
    async <T extends FlowStep>(
      data: FlowStepOutputTyper<T>,
      replace: boolean = false
    ) => {
      const newState = await Promise.resolve(state)
        .then((state) => {
          if (!state) {
            return createFlow(type, location.search)
          }
          return Promise.resolve(state)
        })
        .then((state) => runFlowStep(state, data))

      if (newState.finished) {
        navigate(newState.finishRedirectURI ?? to)
      } else {
        setState(newState)
        navigate(location.pathname, { replace, state: newState })
      }
    },
    [state, to, type, location, navigate]
  )
  const onResetFlow = useCallback(() => {
    setState(null)
  }, [])

  useEffect(() => {
    setState(isFlowState(location.state) ? location.state : null)
    console.debug('load state', location.state)
  }, [location, navigate])

  return (
    <div className="grid gap-6 grid-cols-1">
      <FlowStepForm
        defaultIdentityState={defaultIdentityState}
        executeFlow={onExecuteFlow}
        resetFlow={onResetFlow}
        state={state}
        {...props}
      />
    </div>
  )
}
