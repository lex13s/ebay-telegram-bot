import { getIsoDateMinusDays } from '../src/utils';

describe('getIsoDateMinusDays', () => {
  it('should return an ISO date string for today minus the specified number of days', () => {
    const today = new Date();
    const expectedDate = new Date();
    expectedDate.setDate(today.getDate() - 5);

    const result = getIsoDateMinusDays(5);

    // We can't directly compare the full ISO string due to time, so we compare the date part
    expect(result.substring(0, 10)).toEqual(expectedDate.toISOString().substring(0, 10));
  });

  it('should return an ISO date string for today when 0 days are specified', () => {
    const today = new Date();
    const expectedDate = new Date();

    const result = getIsoDateMinusDays(0);

    expect(result.substring(0, 10)).toEqual(expectedDate.toISOString().substring(0, 10));
  });

  it('should handle negative days by returning a future date', () => {
    const today = new Date();
    const expectedDate = new Date();
    expectedDate.setDate(today.getDate() + 3);

    const result = getIsoDateMinusDays(-3);

    expect(result.substring(0, 10)).toEqual(expectedDate.toISOString().substring(0, 10));
  });
});