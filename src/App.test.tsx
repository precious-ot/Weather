import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('shows the weather dashboard for a searched city', async () => {
  const mockedFetch = jest.fn();
  global.fetch = mockedFetch as unknown as typeof fetch;

  mockedFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ name: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276 }],
      }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 21,
          relative_humidity_2m: 58,
          wind_speed_10m: 12,
          weather_code: 1,
        },
        daily: {
          temperature_2m_max: [24, 23, 22],
          temperature_2m_min: [15, 14, 13],
          weather_code: [1, 2, 3],
        },
      }),
    } as Response);

  render(<App />);

  const input = screen.getByPlaceholderText(/search for a city/i);
  await userEvent.type(input, 'London');
  await userEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(await screen.findByText(/weather dashboard/i)).toBeInTheDocument();
  expect(await screen.findByText(/london/i)).toBeInTheDocument();
});
