export function serializeCreate(input) {
  return {
    name: input.name,
    timezone: input.timezone,
    active: input.active ?? true
  };
}

export function serializeUpdate(input) {
  const output = {};

  if (Object.prototype.hasOwnProperty.call(input, 'name')) {
    output.name = input.name;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'active')) {
    output.active = input.active;
  }

  return output;
}
