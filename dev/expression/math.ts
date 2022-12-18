export const math = [
  {
    "name": "Math",
    "members": [
      {
        "name": "E",
        "comment": "The mathematical constant e. This is Euler's number, the base of natural logarithms."
      },
      {
        "name": "LN10",
        "comment": "The natural logarithm of 10."
      },
      {
        "name": "LN2",
        "comment": "The natural logarithm of 2."
      },
      {
        "name": "LOG2E",
        "comment": "The base-2 logarithm of e."
      },
      {
        "name": "LOG10E",
        "comment": "The base-10 logarithm of e."
      },
      {
        "name": "PI",
        "comment": "Pi. This is the ratio of the circumference of a circle to its diameter."
      },
      {
        "name": "SQRT1_2",
        "comment": "The square root of 0.5, or, equivalently, one divided by the square root of 2."
      },
      {
        "name": "SQRT2",
        "comment": "The square root of 2."
      },
      {
        "name": "abs",
        "comment": "Returns the absolute value of a number (the value without regard to whether it is positive or negative).\r\nFor example, the absolute value of -5 is the same as the absolute value of 5.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression for which the absolute value is needed.",
            "optional": false
          }
        ]
      },
      {
        "name": "acos",
        "comment": "Returns the arc cosine (or inverse cosine) of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "asin",
        "comment": "Returns the arcsine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "atan",
        "comment": "Returns the arctangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression for which the arctangent is needed.",
            "optional": false
          }
        ]
      },
      {
        "name": "atan2",
        "comment": "Returns the angle (in radians) from the X axis to a point.",
        "parameters": [
          {
            "name": "y",
            "comment": "A numeric expression representing the cartesian y-coordinate.",
            "optional": false
          },
          {
            "name": "x",
            "comment": "A numeric expression representing the cartesian x-coordinate.",
            "optional": false
          }
        ]
      },
      {
        "name": "ceil",
        "comment": "Returns the smallest integer greater than or equal to its numeric argument.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "cos",
        "comment": "Returns the cosine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "exp",
        "comment": "Returns e (the base of natural logarithms) raised to a power.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression representing the power of e.",
            "optional": false
          }
        ]
      },
      {
        "name": "floor",
        "comment": "Returns the greatest integer less than or equal to its numeric argument.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "log",
        "comment": "Returns the natural logarithm (base e) of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "max",
        "comment": "Returns the larger of a set of supplied numeric expressions.",
        "parameters": [
          {
            "name": "values",
            "comment": "Numeric expressions to be evaluated.",
            "optional": false
          }
        ]
      },
      {
        "name": "min",
        "comment": "Returns the smaller of a set of supplied numeric expressions.",
        "parameters": [
          {
            "name": "values",
            "comment": "Numeric expressions to be evaluated.",
            "optional": false
          }
        ]
      },
      {
        "name": "pow",
        "comment": "Returns the value of a base expression taken to a specified power.",
        "parameters": [
          {
            "name": "x",
            "comment": "The base value of the expression.",
            "optional": false
          },
          {
            "name": "y",
            "comment": "The exponent value of the expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "random",
        "comment": "Returns a pseudorandom number between 0 and 1.",
        "parameters": []
      },
      {
        "name": "round",
        "comment": "Returns a supplied numeric expression rounded to the nearest integer.",
        "parameters": [
          {
            "name": "x",
            "comment": "The value to be rounded to the nearest integer.",
            "optional": false
          }
        ]
      },
      {
        "name": "sin",
        "comment": "Returns the sine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "sqrt",
        "comment": "Returns the square root of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "tan",
        "comment": "Returns the tangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "clz32",
        "comment": "Returns the number of leading zero bits in the 32-bit binary representation of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "imul",
        "comment": "Returns the result of 32-bit multiplication of two numbers.",
        "parameters": [
          {
            "name": "x",
            "comment": "First number",
            "optional": false
          },
          {
            "name": "y",
            "comment": "Second number",
            "optional": false
          }
        ]
      },
      {
        "name": "sign",
        "comment": "Returns the sign of the x, indicating whether x is positive, negative or zero.",
        "parameters": [
          {
            "name": "x",
            "comment": "The numeric expression to test",
            "optional": false
          }
        ]
      },
      {
        "name": "log10",
        "comment": "Returns the base 10 logarithm of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "log2",
        "comment": "Returns the base 2 logarithm of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "log1p",
        "comment": "Returns the natural logarithm of 1 + x.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "expm1",
        "comment": "Returns the result of (e^x - 1), which is an implementation-dependent approximation to\r\nsubtracting 1 from the exponential function of x (e raised to the power of x, where e\r\nis the base of the natural logarithms).",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "cosh",
        "comment": "Returns the hyperbolic cosine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "sinh",
        "comment": "Returns the hyperbolic sine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "tanh",
        "comment": "Returns the hyperbolic tangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "acosh",
        "comment": "Returns the inverse hyperbolic cosine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "asinh",
        "comment": "Returns the inverse hyperbolic sine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "atanh",
        "comment": "Returns the inverse hyperbolic tangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "hypot",
        "comment": "Returns the square root of the sum of squares of its arguments.",
        "parameters": [
          {
            "name": "values",
            "comment": "Values to compute the square root for.\r\nIf no arguments are passed, the result is +0.\r\nIf there is only one argument, the result is the absolute value.\r\nIf any argument is +Infinity or -Infinity, the result is +Infinity.\r\nIf any argument is NaN, the result is NaN.\r\nIf all arguments are either +0 or −0, the result is +0.",
            "optional": false
          }
        ]
      },
      {
        "name": "trunc",
        "comment": "Returns the integral part of the a numeric expression, x, removing any fractional digits.\r\nIf x is already an integer, the result is x.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "fround",
        "comment": "Returns the nearest single precision float representation of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "cbrt",
        "comment": "Returns an implementation-dependent approximation to the cube root of number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      }
    ]
  }
]