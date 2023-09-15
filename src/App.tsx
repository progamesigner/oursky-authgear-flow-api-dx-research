import { RouterProvider } from 'react-router'
import { createBrowserRouter } from 'react-router-dom'

import SuccessScreen from './SuccessScreen'
import MainScreen from './MainScreen'

import './app.css'

export default function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainScreen />,
    },
    {
      path: '/login/done',
      element: <SuccessScreen type="login" />,
    },
    {
      path: '/signup/done',
      element: <SuccessScreen type="signup" />,
    },
  ])

  return <RouterProvider router={router} />
}
