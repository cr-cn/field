export default class Field {
  constructor(com) {
    this.com = com;
    this.fieldsMeta = {};
  }

  init(name, fieldOptions = {}) {
    const fieldsMeta = this.fieldsMeta;
    const { onChange, rules } = fieldOptions;

    if (!fieldsMeta[name]) {
      fieldsMeta[name] = Object.assign({}, fieldOptions, {
        onChange: validateChange.bind(this)
      });
    }

    const field = fieldsMeta[name];
    const state = this.com.state;
    const outputParams = {
      name,
      onChange: outputOnChange.bind(this),
      ref: name,
      status: state[`${name}Status`],
      errorMessage: state[`${name}Msg`]
    };
    return outputParams;

    function validateChange(value) {
      let isValid = false;
      field.value = value;
      const validResult = this.isValid(rules, value);

      isValid = validResult.isValid;
      this.com.setState({
        [`${name}Status`]: isValid ? "success" : "error",
        [`${name}Msg`]: isValid ? "" : "validResult.msg"
      });
    }

    function outputOnChange(value) {
      validateChange.call(this, value);
      onChange && onChange.call(this, value);
    }
  }

  isValid(rules, value) {
    let isValid = true;
    let message = "";
    let notValidate = false;

    notValidate = rules.some(rule => rule.required === false);

    if (notValidate) {
      return {
        isValid: true,
        msg: ""
      };
    }

    if (!value) {
      return {
        isValid: false,
        msg: rules[0].msg || rules[1].msg
      };
    }

    rules.every(({ rule, msg }) => {
      if (isFunction(rule)) {
        isValid = rule.call(this.com, value);
      } else if (isReg(rule)) {
        isValid = rule.test(value);
      }

      message = msg;

      return isValid;
    });

    return {
      isValid,
      msg: message
    };
  }

  validate(cb) {
    const fieldMeta = this.fieldsMeta;
    let error = false;
    let field;
    const values = {};
    let validResult;

    for (const name in fieldsMeta) {
      field = fieldMeta[name];
      const { rules, onChange } = field;
      let { value } = field;

      if (!value) {
        value =
          this.com.refs[name] &&
          this.com.refs[name].getValue &&
          this.com.refs[name].getValue();
      }

      onChange.call(this.value);

      if (!error) {
        validResult = this.isValid(rules, value);
        error = !validResult.isValid;
      }
      value[name] = field.value;
    }

    cb(error, values);
  }

  setError(name, msg) {
    this.com.setState({
      [`${name}Status`]: "error",
      [`${name}Msg`]: msg
    });
  }

  getValue(name) {
    if (!name) {
      return "";
    }

    const fieldMeta = this.fieldsMeta;
    const field = fieldsMeta[name];
    if (!field) {
      return "";
    }
    if (field.value) {
      return field.value;
    }
    return (
      this.com.refs[name] &&
      this.com.refs[name].getValue &&
      this.com.refs[name].getValue()
    );
  }

  getValues(names) {
    const fieldMeta = this.fieldsMeta;
    const result = {};

    if (names === undefined) {
      for (const name in fieldsMeta) {
        result[name] = this.getValue(name);
      }
    } else if (names instanceof Array) {
      names.forEach(name => {
        result[name] = this.getValue(name);
      });
    }
    return result;
  }
}

function isFunction(o) {
  return typeof o === "function";
}

function isReg(o) {
  return o instanceof RegExp;
}
