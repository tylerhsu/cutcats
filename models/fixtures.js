const FIXTURES = {
  Invoice: {
    periodStart: new Date('2000-01-01'),
    periodEnd: new Date('2000-01-15'),
    filePath: '/test.zip'
  }
};

export function fixture(name, attrs) {
  return {
    ...FIXTURES[name],
    ...attrs
  };
}

export function fixtureArray(name, ...args) {
  let attrs = {};
  let quantity = 1;
  
  if (args.length === 1) {
    quantity = args[0];
  } else if (args.length === 2) {
    attrs = args[0];
    quantity = args[1];
  } else {
    throw new Error(`Expected 2 or 3 arguments, got ${arguments.length}`);
  }

  let objs = [];
  for (let n = 0; n < quantity; n++) {
    objs.push(fixture(name, attrs));
  }
  return objs;
}
