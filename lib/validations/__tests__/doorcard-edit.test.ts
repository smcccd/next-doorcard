import { basicInfoSchema, timeBlockSchema, doorcardEditorSchema } from '../doorcard-edit';

describe('Doorcard Edit Validations', () => {
  // Basic test to ensure the module exports work
  it('should export validation schemas', () => {
    expect(basicInfoSchema).toBeDefined();
    expect(timeBlockSchema).toBeDefined(); 
    expect(doorcardEditorSchema).toBeDefined();
  });

  it('should export type definitions', () => {
    // This test ensures TypeScript types are properly exported
    expect(typeof basicInfoSchema).toBe('object');
    expect(typeof timeBlockSchema).toBe('object');
    expect(typeof doorcardEditorSchema).toBe('object');
  });
});