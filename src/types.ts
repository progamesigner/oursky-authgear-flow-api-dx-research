type TypeName<T> = T extends boolean
  ? 'boolean'
  : T extends number
  ? 'number'
  : T extends string
  ? 'string'
  : 'object'

export type AuthgearFlowReferenceType =
  | 'login_flow'
  // | 'reauth_flow'
  | 'signup_flow'
// | 'signup_login_flow'

export type AuthgearFlowStepType =
  | 'authenticate'
  // | 'change_password'
  | 'identify'
  // | 'recovery_code'
  // | 'user_profile'
  | 'verify'

export type AuthgearFlowStepAuthenticationType =
  | 'primary_oob_otp_email'
  | 'primary_oob_otp_sms'
  | 'primary_password'
  // | 'recovery_code'
  // | 'secondary_oob_otp_email'
  // | 'secondary_oob_otp_sms'
  // | 'secondary_password'
  | 'secondary_totp'

export type AuthgearFlowStepIdentificationType = 'email' | 'phone' | 'username'

/// Authgear Shared Types

interface AuthgearFlowReference {
  type: AuthgearFlowReferenceType
  id: string
}

interface AuthgearFlowStep {
  type: AuthgearFlowStepType
  authentication?: AuthgearFlowStepAuthenticationType
  identification?: AuthgearFlowStepIdentificationType
}

/// Authgear Request

export interface AuthgearFlowCreateRequest {
  bind_user_agent?: boolean
  flow_reference: AuthgearFlowReference
}

export type AuthgearFlowExecuteRequest<T extends AuthgearFlowRequestInput> =
  | AuthgearFlowBatchInputRequest<T>
  | AuthgearFlowIndividualInputRequest<T>

interface AuthgearFlowBatchInputRequest<T extends AuthgearFlowRequestInput> {
  batch_input: T[]
}

interface AuthgearFlowIndividualInputRequest<
  T extends AuthgearFlowRequestInput
> {
  input: T
}

export interface AuthgearFlowRequestInput {}

/// Authgear Response

export interface AuthgearFlowResponse<
  T extends AuthgearFlowResponseResultData,
  U extends AuthgearFlowResponseResultSchema = AuthgearFlowResponseResultSchema
> {
  error?: AuthgearFlowResponseErrorResult
  result: AuthgearFlowResponseResult<T, U>
}

export interface AuthgearFlowResponseErrorResult {
  code: number
  info: Record<string, unknown>
  message: string
  name: string
  reason: string
}

interface AuthgearFlowResponseResult<
  T extends AuthgearFlowResponseResultData,
  U extends AuthgearFlowResponseResultSchema
> {
  id: string
  websocket_id?: string
  flow_reference?: AuthgearFlowReference
  flow_step?: AuthgearFlowStep
  finished?: boolean
  data: T
  json_schema: U
}

export interface AuthgearFlowResponseResultData {
  finish_redirect_uri?: string
}

export interface AuthgearFlowResponseResultSchema {
  type: TypeName<object>
  properties?: Record<
    string,
    | AuthgearFlowResponseResultSchemaProperty
    | AuthgearFlowResponseResultSchemaProperty<boolean>
    | AuthgearFlowResponseResultSchemaProperty<number>
    | undefined
  >
  required?: string[]
  anyOf?: Omit<AuthgearFlowResponseResultSchema, 'type'>[]
  oneOf?: Omit<AuthgearFlowResponseResultSchema, 'type'>[]
}

export interface AuthgearFlowResponseResultSchemaProperty<
  T extends boolean | number | string = string,
  U extends boolean | number | string = T
> {
  type: TypeName<U>
  const?: T
  nullable?: boolean
}

export interface AuthgearFlowResponseResultSchemaConstantProperty<
  T extends boolean | number | string = string,
  U extends boolean | number | string = T
> extends AuthgearFlowResponseResultSchemaProperty<T, U> {
  const: T
}
