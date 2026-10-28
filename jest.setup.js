import '@testing-library/jest-dom';
jest.spyOn(console, 'log').mockImplementation(() => {});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;