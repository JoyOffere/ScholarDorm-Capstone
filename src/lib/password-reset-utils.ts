import { supabase } from './supabase'

/**
 * Check if an email exists in the users table
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, other errors are real issues
      throw error
    }
    
    return !!data
  } catch (error) {
    console.error('Error checking email:', error)
    throw new Error('Failed to verify email. Please try again.')
  }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    // First check if email exists
    const emailExists = await checkEmailExists(email)
    
    if (!emailExists) {
      throw new Error('No account found with this email address. Please check your email or create a new account.')
    }

    // Send password reset email using Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`
      }
    )

    if (error) {
      throw error
    }
  } catch (error: any) {
    console.error('Send password reset email error:', error)
    throw error
  }
}

/**
 * Update user password during reset flow
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw error
    }
  } catch (error: any) {
    console.error('Update password error:', error)
    throw error
  }
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): string[] => {
  const errors = []
  
  if (password.length < 8) {
    errors.push('At least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character')
  }
  
  return errors
}

/**
 * Check if password reset session is valid
 */
export const validateResetSession = async (accessToken: string, refreshToken: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    return !error
  } catch (error) {
    console.error('Error validating reset session:', error)
    return false
  }
}