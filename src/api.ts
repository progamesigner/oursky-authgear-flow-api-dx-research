export * from './types'

import {
  AuthgearFlowCreateRequest,
  AuthgearFlowExecuteRequest,
  AuthgearFlowRequestInput,
  AuthgearFlowResponse,
  AuthgearFlowResponseResultData,
  AuthgearFlowResponseResultSchema,
  AuthgearFlowStepAuthenticationType,
  AuthgearFlowStepIdentificationType,
} from './types'

const AUTHGEAR_ENDPOINT = 'https://just-obey-1002.authgear-staging.com'

/// Shared Types

interface AuthenticateOutput extends AuthgearFlowResponseResultData {
  candidates: Array<AuthenticationCandidate>
}

interface AuthenticationCandidateTyper<
  T extends AuthgearFlowStepAuthenticationType
> {
  authentication: T
}

interface AuthenticationPrimaryOTPEmailCandidate
  extends AuthenticationCandidateTyper<'primary_oob_otp_email'> {
  channels: Array<'email'>
  masked_display_name: string
}

interface AuthenticationPrimaryOTPSMSCandidate
  extends AuthenticationCandidateTyper<'primary_oob_otp_sms'> {
  channels: Array<'sms' | 'wechat'>
  masked_display_name: string
}

interface AuthenticationPrimaryPasswordCandidate
  extends AuthenticationCandidateTyper<'primary_password'> {
  count: number
}

interface AuthenticationSecondaryTOTPCandidate
  extends AuthenticationCandidateTyper<'secondary_totp'> {}

interface AuthenticateRequest2FAResponseResultData
  extends AuthgearFlowResponseResultData {
  secret: string
}

type AuthenticationCandidate =
  | AuthenticationPrimaryOTPEmailCandidate
  | AuthenticationPrimaryOTPSMSCandidate
  | AuthenticationPrimaryPasswordCandidate
  | AuthenticationSecondaryTOTPCandidate

/// Flow APIs

async function create<
  Output extends AuthgearFlowResponseResultData,
  Schema extends AuthgearFlowResponseResultSchema = AuthgearFlowResponseResultSchema
>(
  body: AuthgearFlowCreateRequest,
  query: string
): Promise<AuthgearFlowResponse<Output, Schema>> {
  return fetch(`${AUTHGEAR_ENDPOINT}/api/v1/authentication_flows${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((response) => response as AuthgearFlowResponse<Output, Schema>)
}

async function execute<
  Input extends AuthgearFlowRequestInput,
  Output extends AuthgearFlowResponseResultData,
  Schema extends AuthgearFlowResponseResultSchema = AuthgearFlowResponseResultSchema
>(
  flowId: string,
  body: AuthgearFlowExecuteRequest<Input>
): Promise<AuthgearFlowResponse<Output, Schema>> {
  return fetch(`${AUTHGEAR_ENDPOINT}/api/v1/authentication_flows/${flowId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((response) => response as AuthgearFlowResponse<Output, Schema>)
}

/// Create Flows

export interface AuthgearFlowCreateResponseResultData
  extends AuthgearFlowResponseResultData {
  candidates: Array<AuthenticationCandidate>
}

export async function createLoginFlow(
  query: string
): Promise<AuthgearFlowResponse<AuthgearFlowCreateResponseResultData>> {
  return await create(
    {
      bind_user_agent: false,
      flow_reference: {
        type: 'login_flow',
        id: 'default',
      },
    },
    query
  )
}

export async function createSignupFlow(
  query: string
): Promise<AuthgearFlowResponse<AuthgearFlowCreateResponseResultData>> {
  return await create(
    {
      bind_user_agent: false,
      flow_reference: {
        type: 'signup_flow',
        id: 'default',
      },
    },
    query
  )
}

/// Execute Flows

export interface AuthgearAuthenticateResponseResultData
  extends AuthgearFlowResponseResultData {
  candidates?: Array<AuthenticationCandidate>
  can_resend_at: string
  code_length: number
  failed_attempt_rate_limit_exceeded: boolean
  masked_claim_value: string
  otp_form: string
}

interface IdentifyRequestInput extends AuthgearFlowRequestInput {
  identification: AuthgearFlowStepIdentificationType
  login_id: string
}

interface AuthenticateRequestInput<T extends AuthgearFlowStepAuthenticationType>
  extends AuthgearFlowRequestInput {
  authentication: T
}

export async function executeFlowIdentifyWithEmail(
  flowId: string,
  email: string
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    IdentifyRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    input: {
      identification: 'email',
      login_id: email,
    },
  })
}

export async function executeFlowIdentifyWithPhone(
  flowId: string,
  phone: string
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    IdentifyRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    input: {
      identification: 'phone',
      login_id: phone,
    },
  })
}

interface AuthenticateRequestOTPViaEmailRequestInput
  extends AuthenticateRequestInput<'primary_oob_otp_email'> {
  index: number
}

export async function executeFlowRequestOTPViaEmail(
  flowId: string,
  index: number
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    AuthenticateRequestOTPViaEmailRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    input: {
      authentication: 'primary_oob_otp_email',
      index,
    },
  })
}

interface AuthenticateRequestResendOTPViaEmailRequestInput
  extends AuthenticateRequestInput<'primary_oob_otp_email'> {
  resend: boolean
}

export async function executeFlowRequestResendOTPViaEmail(
  flowId: string
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    AuthenticateRequestResendOTPViaEmailRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    input: {
      authentication: 'primary_oob_otp_email',
      resend: true,
    },
  })
}

interface AuthenticateWithOTPRequestInput {
  code: string
}

export async function executeFlowAuthenticateWithOTP(
  flowId: string,
  code: string
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    AuthenticateWithOTPRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    input: {
      code,
    },
  })
}

/// Execute Flows (Login Flows)

interface LoginAuthenticateRequestOTPViaSMSRequestInput
  extends AuthenticateRequestInput<'primary_oob_otp_sms'> {
  channel: 'sms'
  index: number
}

export async function executeLoginFlowRequentOTPViaSMS(
  flowId: string,
  index: number
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    LoginAuthenticateRequestOTPViaSMSRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    input: {
      authentication: 'primary_oob_otp_sms',
      index,
      channel: 'sms',
    },
  })
}

interface LoginAuthenticateWith2FARequestInput
  extends AuthenticateRequestInput<'secondary_totp'> {
  code: string
}

export async function executeLoginFlowAuthenticateWith2FA(
  flowId: string,
  code: string
): Promise<AuthgearFlowResponse<AuthenticateRequest2FAResponseResultData>> {
  return await execute<
    LoginAuthenticateWith2FARequestInput,
    AuthenticateRequest2FAResponseResultData
  >(flowId, {
    input: {
      authentication: 'secondary_totp',
      code,
    },
  })
}

interface LoginAuthenticateWithPasswordRequestInput
  extends AuthenticateRequestInput<'primary_password'> {
  password: string
}

export async function executeLoginCodeFlowAuthenticateWithPassword(
  flowId: string,
  password: string
): Promise<AuthgearFlowResponse<AuthenticateOutput>> {
  return await execute<
    LoginAuthenticateWithPasswordRequestInput,
    AuthenticateOutput
  >(flowId, {
    input: {
      authentication: 'primary_password',
      password,
    },
  })
}

/// Execute Flows (Signup Flows)

interface SignupAuthenticateWithRequest2FARequestInput
  extends AuthenticateRequestInput<'secondary_totp'> {}

export async function executeSignupFlowRequest2FA(
  flowId: string
): Promise<AuthgearFlowResponse<AuthenticateRequest2FAResponseResultData>> {
  return await execute<
    SignupAuthenticateWithRequest2FARequestInput,
    AuthenticateRequest2FAResponseResultData
  >(flowId, {
    input: {
      authentication: 'secondary_totp',
    },
  })
}

interface SignupAuthenticateRequestOTPViaSMSRequestInput
  extends AuthenticateRequestInput<'primary_oob_otp_sms'> {}

interface SignupAuthenticateRequestOTPViaSMSChannelRequestInput
  extends AuthgearFlowRequestInput {
  channel: 'sms'
}

export async function executeSignupFlowRequentOTPViaSMS(
  flowId: string
): Promise<AuthgearFlowResponse<AuthgearAuthenticateResponseResultData>> {
  return await execute<
    | SignupAuthenticateRequestOTPViaSMSRequestInput
    | SignupAuthenticateRequestOTPViaSMSChannelRequestInput,
    AuthgearAuthenticateResponseResultData
  >(flowId, {
    batch_input: [
      {
        authentication: 'primary_oob_otp_sms',
      },
      {
        channel: 'sms',
      },
    ],
  })
}

interface SignupAuthenticateWith2FARequestInput {
  code: string
  display_name: string
}

export async function executeSignupFlowAuthenticateWith2FA(
  flowId: string,
  code: string,
  displayName: string
): Promise<AuthgearFlowResponse<AuthgearFlowResponseResultData>> {
  return await execute<
    SignupAuthenticateWith2FARequestInput,
    AuthgearFlowResponseResultData
  >(flowId, {
    input: {
      code,
      display_name: displayName,
    },
  })
}

interface SignupAuthenticateWithPasswordRequestInput
  extends AuthenticateRequestInput<'primary_password'> {
  new_password: string
}

export async function executeSignupFlowAuthenticateWithPassword(
  flowId: string,
  password: string
): Promise<AuthgearFlowResponse<AuthenticateOutput>> {
  return await execute<
    SignupAuthenticateWithPasswordRequestInput,
    AuthenticateOutput
  >(flowId, {
    input: {
      authentication: 'primary_password',
      new_password: password,
    },
  })
}
