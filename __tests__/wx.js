global.wx = {
  request: jest.fn(),
};

test('isWx', () => {
  expect(wx).toEqual(global.wx)
})
