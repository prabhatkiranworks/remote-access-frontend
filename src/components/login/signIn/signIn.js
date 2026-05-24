import { useState } from 'react'
import { apiClient, API_PATHS, setAuthToken } from '../../../common/api.js'

const SIGNIN_ENDPOINT = API_PATHS.signIn

export async function signInUser(data) {
  return apiClient.post(SIGNIN_ENDPOINT, data)
}

export function useSignInForm(onSuccess) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await signInUser(form)
      // Store the JWT token in memory so all subsequent API calls are authenticated
      const token = response?.data?.token
      if (token) {
        setAuthToken(token)
      }
      setMessage('Signed in successfully.')
      setForm({ email: '', password: '' })
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Signin failed.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    loading,
    message,
    error,
    handleChange,
    handleSubmit,
  }
}
