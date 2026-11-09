export const en = {
  app: {
    name: 'onemore',
  },
  home: {
    title: 'onemore',
    subtitle: 'Workout and nutrition diary',
    signOut: 'Sign out',
  },
  auth: {
    or: 'or',
    google: 'Continue with Google',
    signIn: {
      title: 'Sign in',
      email: 'Email',
      emailPlaceholder: 'example@gmail.com',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      submit: 'Sign in',
      switch: "Don't have an account? Sign up",
    },
    signUp: {
      title: 'Sign up',
      email: 'Email',
      emailPlaceholder: 'example@gmail.com',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      username: 'Username',
      usernamePlaceholder: 'username',
      submit: 'Continue',
      switch: 'Already have an account? Sign in',
    },
    toast: {
      signedUp: 'Account created',
      signedIn: 'Signed in',
      signedOut: 'Signed out',
    },
    errors: {
      invalidCredentials: 'Wrong email or password',
      emailTaken: 'An account with this email already exists',
      passwordTooShort: 'Password is too short',
      network: 'Network error. Try again.',
      googleFailed: 'Google sign-in failed',
      generic: 'Something went wrong',
    },
  },
  validation: {
    email: 'Enter a valid email',
    passwordMin: 'At least 8 characters',
    passwordMax: 'At most 128 characters',
    username: 'Enter a username',
    required: 'This field is required',
  },
  common: {
    loading: 'Loading',
    retry: 'Retry',
  },
  errors: {
    generic: {
      title: 'Something went wrong',
      description: 'Please try again.',
    },
  },
  notFound: {
    title: 'Page not found',
    description: 'This page does not exist.',
    home: 'Back to home',
  },
  pwa: {
    update: {
      message: 'A new version is available.',
      reload: 'Reload',
      later: 'Later',
    },
  },
} as const;
