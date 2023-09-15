import React from 'react'

export type SucessType = 'login' | 'signup'

export interface SuccessScreenProps extends React.PropsWithChildren {
  type: SucessType
}

export default function SuccessScreen({
  type,
  ...props
}: SuccessScreenProps): JSX.Element {
  return (
    <>
      <h1 className="my-16 text-4xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        Authgear DX Research
      </h1>

      <div className="mx-auto w-[36rem]" {...props}>
        <p className="text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
          {type === 'signup' ? 'Signup Success!' : 'Login Success!'}
        </p>
      </div>
    </>
  )
}
