import { default as cx } from 'classnames'
import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import FlowForm from './FlowForm'

const enum Tabs {
  SIGNIN,
  SIGNUP,
}

const DEFAULT_IDENTITY_STATE = {
  allowEmail: true,
  allowPhone: true,
}

interface TabButtonProps
  extends React.PropsWithChildren<
    React.ButtonHTMLAttributes<HTMLButtonElement>
  > {
  isActive: boolean
}

const TabButton = ({
  isActive,
  children,
  ...props
}: TabButtonProps): JSX.Element => (
  <button
    className={cx('inline-block w-full p-4 border-b-2 rounded-t-lg', {
      'bg-gray-50 border-b-gray-50 text-blue-600 dark:bg-gray-800 dark:border-b-gray-800 dark:text-blue-500':
        isActive,
      'bg-gray-200 border-b-blue-600 hover:text-gray-600 dark:bg-gray-700 dark:border-b-blue-800 dark:hover:text-gray-300':
        !isActive,
    })}
    {...props}
  >
    {children}
  </button>
)

export default function MainScreen() {
  const location = useLocation()
  const navigate = useNavigate()

  const [tab, setTab] = useState(Tabs.SIGNIN)

  const onSigninTabClicked = useCallback(() => {
    setTab(Tabs.SIGNIN)
    navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])
  const onSignupTabClicked = useCallback(() => {
    setTab(Tabs.SIGNUP)
    navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])

  return (
    <>
      <h1 className="my-16 text-4xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        Authgear DX Research
      </h1>

      <div className="mx-auto w-[36rem]">
        <ul className="flex justify-stretch text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <li className="grow mr-2">
            <TabButton
              isActive={tab === Tabs.SIGNUP}
              onClick={onSignupTabClicked}
            >
              Sign-up
            </TabButton>
          </li>
          <li className="grow ml-2">
            <TabButton
              isActive={tab === Tabs.SIGNIN}
              onClick={onSigninTabClicked}
            >
              Login
            </TabButton>
          </li>
        </ul>
        <div className="rounded-b-lg p-4 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <div className={cx({ hidden: tab !== Tabs.SIGNUP })}>
            <h2 className="mb-4 text-center text-4xl font-extrabold dark:text-white">
              Signup
            </h2>

            <FlowForm
              defaultIdentityState={DEFAULT_IDENTITY_STATE}
              to='/signup/done'
              type="signup"
            />
          </div>
          <div className={cx({ hidden: tab !== Tabs.SIGNIN })}>
            <h2 className="mb-4 text-center text-4xl font-extrabold dark:text-white">
              Login
            </h2>

            <FlowForm
              defaultIdentityState={DEFAULT_IDENTITY_STATE}
              to='/login/done'
              type="login"
            />
          </div>
        </div>
      </div>
    </>
  )
}
