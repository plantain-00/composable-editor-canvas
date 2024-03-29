import test from 'ava'
import { GeometryLine, boldGeometryLines, getParallelBezierCurvesByDistance, getParallelGeometryLinesByDistanceDirectionIndex, getParallelPolylinesByDistance, getParallelQuadraticCurvesByDistance } from '../src'

test('getParallelGeometryLinesByDistanceDirectionIndex', t => {
  const lines: GeometryLine[] = [
    {
      "type": "arc",
      "curve": {
        "x": 15.871241330962357,
        "y": -168.09652270460097,
        "r": 22.044051402427367,
        "startAngle": -86.77504754830086,
        "endAngle": 79.01928717081722,
        "counterclockwise": false
      }
    },
    {
      "type": "arc",
      "curve": {
        "x": 36.06041303776424,
        "y": -133.11619820943267,
        "r": 20.824032059162636,
        "startAngle": -140.16344414459851,
        "endAngle": 80.09437949310146,
        "counterclockwise": false
      }
    }
  ]
  t.snapshot(getParallelGeometryLinesByDistanceDirectionIndex(lines, 6, 0))
  t.snapshot(getParallelGeometryLinesByDistanceDirectionIndex(lines, 6, 1))
})

test('boldGeometryLines', t => {
  // B
  t.snapshot(boldGeometryLines([
    [
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 11.8,
            "y": 15.799999999999997
          },
          "cp": {
            "x": 16.45,
            "y": 16.049999999999997
          },
          "to": {
            "x": 19.150000000000002,
            "y": 17.875
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 19.150000000000002,
            "y": 17.875
          },
          "cp": {
            "x": 21.85,
            "y": 19.7
          },
          "to": {
            "x": 22,
            "y": 22.45
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 22,
            "y": 22.45
          },
          "cp": {
            "x": 22.150000000000002,
            "y": 25.9
          },
          "to": {
            "x": 20.8,
            "y": 28.674999999999997
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 20.8,
            "y": 28.674999999999997
          },
          "cp": {
            "x": 19.450000000000003,
            "y": 31.45
          },
          "to": {
            "x": 16.35,
            "y": 32.2
          }
        }
      },
      [
        {
          "x": 16.35,
          "y": 32.2
        },
        {
          "x": 8.6,
          "y": 32.2
        }
      ],
      [
        {
          "x": 8.6,
          "y": 32.2
        },
        {
          "x": 8.6,
          "y": 15.799999999999997
        }
      ],
      [
        {
          "x": 8.6,
          "y": 15.799999999999997
        },
        {
          "x": 11.8,
          "y": 15.799999999999997
        }
      ]
    ],
    [
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 3.6,
            "y": 49.3
          },
          "cp": {
            "x": 1.6500000000000001,
            "y": 49.3
          },
          "to": {
            "x": 0.6000000000000001,
            "y": 50.05
          }
        }
      },
      [
        {
          "x": 0.6000000000000001,
          "y": 50.05
        },
        {
          "x": 15,
          "y": 50.05
        }
      ],
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 15,
            "y": 50.05
          },
          "cp": {
            "x": 21.55,
            "y": 50.05
          },
          "to": {
            "x": 25.675,
            "y": 48.375
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 25.675,
            "y": 48.375
          },
          "cp": {
            "x": 29.8,
            "y": 46.7
          },
          "to": {
            "x": 29.8,
            "y": 41.75
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 29.8,
            "y": 41.75
          },
          "cp": {
            "x": 29.85,
            "y": 37.45
          },
          "to": {
            "x": 27.175,
            "y": 35.175
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 27.175,
            "y": 35.175
          },
          "cp": {
            "x": 24.5,
            "y": 32.9
          },
          "to": {
            "x": 20.200000000000003,
            "y": 32.349999999999994
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 20.200000000000003,
            "y": 32.349999999999994
          },
          "cp": {
            "x": 23.650000000000002,
            "y": 31.4
          },
          "to": {
            "x": 25.825000000000003,
            "y": 29.15
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 25.825000000000003,
            "y": 29.15
          },
          "cp": {
            "x": 28,
            "y": 26.9
          },
          "to": {
            "x": 28,
            "y": 23.5
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 28,
            "y": 23.5
          },
          "cp": {
            "x": 28,
            "y": 19.75
          },
          "to": {
            "x": 25.5,
            "y": 17.9
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 25.5,
            "y": 17.9
          },
          "cp": {
            "x": 23,
            "y": 16.049999999999997
          },
          "to": {
            "x": 19.450000000000003,
            "y": 15.549999999999997
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 19.450000000000003,
            "y": 15.549999999999997
          },
          "cp": {
            "x": 15.9,
            "y": 15.049999999999997
          },
          "to": {
            "x": 11,
            "y": 15.049999999999997
          }
        }
      },
      [
        {
          "x": 11,
          "y": 15.049999999999997
        },
        {
          "x": 8.6,
          "y": 15.049999999999997
        }
      ],
      [
        {
          "x": 8.6,
          "y": 15.049999999999997
        },
        {
          "x": 0.6000000000000001,
          "y": 15.049999999999997
        }
      ],
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 0.6000000000000001,
            "y": 15.049999999999997
          },
          "cp": {
            "x": 1.1500000000000001,
            "y": 15.5
          },
          "to": {
            "x": 1.925,
            "y": 15.649999999999999
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 1.925,
            "y": 15.649999999999999
          },
          "cp": {
            "x": 2.7,
            "y": 15.799999999999997
          },
          "to": {
            "x": 3.8000000000000003,
            "y": 15.799999999999997
          }
        }
      },
      [
        {
          "x": 3.8000000000000003,
          "y": 15.799999999999997
        },
        {
          "x": 3.8000000000000003,
          "y": 49.3
        }
      ],
      [
        {
          "x": 3.8000000000000003,
          "y": 49.3
        },
        {
          "x": 3.6,
          "y": 49.3
        }
      ]
    ],
    [
      [
        {
          "x": 8.6,
          "y": 49.3
        },
        {
          "x": 8.6,
          "y": 32.95
        }
      ],
      [
        {
          "x": 8.6,
          "y": 32.95
        },
        {
          "x": 17.1,
          "y": 32.95
        }
      ],
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 17.1,
            "y": 32.95
          },
          "cp": {
            "x": 20.150000000000002,
            "y": 33.75
          },
          "to": {
            "x": 21.675,
            "y": 36.275
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 21.675,
            "y": 36.275
          },
          "cp": {
            "x": 23.200000000000003,
            "y": 38.8
          },
          "to": {
            "x": 23.200000000000003,
            "y": 42
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 23.200000000000003,
            "y": 42
          },
          "cp": {
            "x": 23.200000000000003,
            "y": 45.85
          },
          "to": {
            "x": 19.55,
            "y": 47.6
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 19.55,
            "y": 47.6
          },
          "cp": {
            "x": 15.9,
            "y": 49.35
          },
          "to": {
            "x": 10.950000000000001,
            "y": 49.3
          }
        }
      },
      [
        {
          "x": 10.950000000000001,
          "y": 49.3
        },
        {
          "x": 8.6,
          "y": 49.3
        }
      ]
    ]
  ]))
  // i
  t.snapshot(boldGeometryLines([
    [
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 7.7,
            "y": 24.5
          },
          "cp": {
            "x": 7,
            "y": 24.4
          },
          "to": {
            "x": 6.550000000000001,
            "y": 24.4
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 6.550000000000001,
            "y": 24.4
          },
          "cp": {
            "x": 4.15,
            "y": 24.4
          },
          "to": {
            "x": 3.95,
            "y": 26.799999999999997
          }
        }
      },
      [
        {
          "x": 3.95,
          "y": 26.799999999999997
        },
        {
          "x": 3.95,
          "y": 49.4
        }
      ],
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 3.95,
            "y": 49.4
          },
          "cp": {
            "x": 2.45,
            "y": 49.4
          },
          "to": {
            "x": 1.85,
            "y": 50
          }
        }
      },
      [
        {
          "x": 1.85,
          "y": 50
        },
        {
          "x": 9.75,
          "y": 50
        }
      ],
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 9.75,
            "y": 50
          },
          "cp": {
            "x": 9.1,
            "y": 49.4
          },
          "to": {
            "x": 7.7,
            "y": 49.4
          }
        }
      },
      [
        {
          "x": 7.7,
          "y": 49.4
        },
        {
          "x": 7.7,
          "y": 24.5
        }
      ]
    ],
    [
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 5.7,
            "y": 15.149999999999999
          },
          "cp": {
            "x": 4.95,
            "y": 15.149999999999999
          },
          "to": {
            "x": 4.3,
            "y": 15.799999999999997
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 4.3,
            "y": 15.799999999999997
          },
          "cp": {
            "x": 3.6500000000000004,
            "y": 16.449999999999996
          },
          "to": {
            "x": 3.6500000000000004,
            "y": 17.25
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 3.6500000000000004,
            "y": 17.25
          },
          "cp": {
            "x": 3.6500000000000004,
            "y": 18.15
          },
          "to": {
            "x": 4.275,
            "y": 18.724999999999998
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 4.275,
            "y": 18.724999999999998
          },
          "cp": {
            "x": 4.9,
            "y": 19.299999999999997
          },
          "to": {
            "x": 5.7,
            "y": 19.299999999999997
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 5.7,
            "y": 19.299999999999997
          },
          "cp": {
            "x": 6.65,
            "y": 19.299999999999997
          },
          "to": {
            "x": 7.2250000000000005,
            "y": 18.75
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 7.2250000000000005,
            "y": 18.75
          },
          "cp": {
            "x": 7.800000000000001,
            "y": 18.2
          },
          "to": {
            "x": 7.800000000000001,
            "y": 17.25
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 7.800000000000001,
            "y": 17.25
          },
          "cp": {
            "x": 7.800000000000001,
            "y": 16.449999999999996
          },
          "to": {
            "x": 7.2,
            "y": 15.799999999999997
          }
        }
      },
      {
        "type": "quadratic curve",
        "curve": {
          "from": {
            "x": 7.2,
            "y": 15.799999999999997
          },
          "cp": {
            "x": 6.6000000000000005,
            "y": 15.149999999999999
          },
          "to": {
            "x": 5.7,
            "y": 15.149999999999999
          }
        }
      }
    ]
  ]))
})

test('getParallelPolylinesByDistance', t => {
  t.snapshot(getParallelPolylinesByDistance([
    {
      "x": 481.70645446975016,
      "y": -208.8650339409237
    },
    {
      "x": 570.5464752391842,
      "y": -218.1192027710731
    },
    {
      "x": 589.9802297824979,
      "y": -132.05543265068388
    },
    {
      "x": 515.8948427292573,
      "y": -132.05543265068388
    }
  ], 5, false))
  t.snapshot(getParallelPolylinesByDistance([
    {
      "x": 395.8254096320099,
      "y": -103.18447603393378
    },
    {
      "x": 395.8254096320099,
      "y": -103.18447603393378
    },
    {
      "x": 343.3014725602575,
      "y": -13.031449716746806
    },
    {
      "x": 380.14662244641215,
      "y": 55.95521389988323
    }
  ], 5, false))
  t.snapshot(getParallelPolylinesByDistance([
    {
      "x": 545.437514900758,
      "y": 0.29551939101128255
    },
    {
      "x": 569.499416447419,
      "y": -55.23652515415759
    },
    {
      "x": 533.4382059205442,
      "y": -103.84076542951058
    },
    {
      "x": 473.31509384700837,
      "y": -96.9129611596947
    },
    {
      "x": 449.25319230034734,
      "y": -41.380916614525844
    },
    {
      "x": 485.3144028272221,
      "y": 7.223323660827177
    }
  ], 5, true))
})

test('getParallelQuadraticCurvesByDistance', t => {
  t.snapshot(getParallelQuadraticCurvesByDistance({
    "from": {
      "x": -150.0809593324633,
      "y": -220.7908132246964
    },
    "cp": {
      "x": -110.99313058877931,
      "y": -235.6344434803459
    },
    "to": {
      "x": -89.23512182516917,
      "y": -194.78920238335905
    }
  }, 5))
  t.snapshot(getParallelQuadraticCurvesByDistance({
    "from": {
      "x": -131.19250325951327,
      "y": -245.70007335607636
    },
    "cp": {
      "x": -131.19250325951327,
      "y": -245.70007335607636
    },
    "to": {
      "x": -90.65378581736536,
      "y": -226.21030535504372
    }
  }, 5))
})

test('getParallelBezierCurvesByDistance', t => {
  t.snapshot(getParallelBezierCurvesByDistance({
    "from": {
      "x": -68.04565493616747,
      "y": -220.75317031475458
    },
    "cp1": {
      "x": -33.743663254350054,
      "y": -211.657945247606
    },
    "cp2": {
      "x": -57.91097557563057,
      "y": -175.0171814056647
    },
    "to": {
      "x": -77.92047072335731,
      "y": -188.78995079306105
    }
  }, 5))
  t.snapshot(getParallelBezierCurvesByDistance({
    "from": {
      "x": -158.64439288383977,
      "y": -161.26128980581933
    },
    "cp1": {
      "x": -158.64439288383977,
      "y": -161.26128980581933
    },
    "cp2": {
      "x": -127.73235123188124,
      "y": -216.60972076246514
    },
    "to": {
      "x": -100.71932906352652,
      "y": -161.6743068946513
    }
  }, 5))
})
