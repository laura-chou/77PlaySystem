import { render } from '@testing-library/react';
import React from 'react';

/**
 * Custom render helper if needed.
 */
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};
