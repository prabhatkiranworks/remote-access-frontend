import { useState } from 'react'
import { apiClient, API_PATHS } from '../../../common/api.js'

const SIGNUP_ENDPOINT = API_PATHS.signUp

export async function signUpUser(data) {
  return apiClient.post(SIGNUP_ENDPOINT, data)
}

export function useSignUpForm(onSuccess) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      const response = await signUpUser(form)
      setMessage(response?.data?.message || 'Account created! You can now sign in.')
      setForm({ name: '', email: '', password: '' })
      // Switch to sign-in tab after a short delay so the user sees the success message
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500)
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Signup failed.'
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
