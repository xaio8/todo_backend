import validator from "validator";

export const isValidEmailFormat = (email: string): boolean => {
  return validator.isEmail(email, {
    allow_utf8_local_part: false,
    require_tld: true,
  });
};
