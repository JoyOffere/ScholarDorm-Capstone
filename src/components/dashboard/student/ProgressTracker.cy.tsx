import React from 'react'
import { ProgressTracker } from './ProgressTracker'

describe('<ProgressTracker />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<ProgressTracker />)
  })
})