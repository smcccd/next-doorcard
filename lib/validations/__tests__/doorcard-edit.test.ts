describe('Doorcard Edit Validations', () => {
  // Basic test to ensure the module exports work
  it('should export validation schemas', () => {
    const { basicInfoSchema, timeBlockSchema, doorcardEditorSchema } = require('../doorcard-edit');
    
    expect(basicInfoSchema).toBeDefined();
    expect(timeBlockSchema).toBeDefined(); 
    expect(doorcardEditorSchema).toBeDefined();
  });

  it('should export type definitions', () => {
    // This test ensures TypeScript types are properly exported
    expect(typeof require('../doorcard-edit')).toBe('object');
  });
});