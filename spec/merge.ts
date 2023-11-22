import test from 'ava'
import { deepEquals, getBezierSplineCurves, getQuadraticSplineCurves, mergeBezierCurve, mergeBezierCurvesToBezierSpline, mergeQuadraticCurvesToQuadraticSpline } from '../src'

test('mergeBezierCurve', (t) => {
  t.true(deepEquals(
    mergeBezierCurve(
      {
        from: { "x": 352.1512829049957, "y": -199.599347273665 },
        cp1: { "x": 464.78338819604005, "y": -192.55984069297477 },
        cp2: { "x": 491.3805628214574, "y": -105.68611917030626 },
        to: { "x": 535.8890355681771, "y": -37.29185722334637 }
      },
      {
        from: { "x": 535.8890355681768, "y": -37.291857223346256 },
        cp1: { "x": 558.7529331005954, "y": -2.15788608352662 },
        cp2: { "x": 586.343358340982, "y": 28.09962791056648 },
        to: { "x": 632.7509751943726, "y": 40.153554365992626 }
      },
    ),
    {
      from: { "x": 352.1512829049957, "y": -199.599347273665 },
      cp1: { "x": 522.6422351820856, "y": -188.94366275634695 },
      cp2: { "x": 496.0030238887903, "y": 4.634605974932299 },
      to: { "x": 632.7509751943729, "y": 40.153554365992704 },
    },
  ))
})

test('mergeBezierCurvesToBezierSpline', (t) => {
  const points1 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
    {
      "x": 2010.2384861779929,
      "y": 622.2445132979597
    },
  ]
  t.true(deepEquals(mergeBezierCurvesToBezierSpline(getBezierSplineCurves(points1, false)), points1))

  const points2 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
    {
      "x": 2010.2384861779929,
      "y": 622.2445132979597
    },
    {
      "x": 2495.422445458091,
      "y": 486.217786562196
    }
  ]
  t.true(deepEquals(mergeBezierCurvesToBezierSpline(getBezierSplineCurves(points2, false)), points2))

  const points3 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
    {
      "x": 2010.2384861779929,
      "y": 622.2445132979597
    },
    {
      "x": 2495.422445458091,
      "y": 486.217786562196
    },
    {
      "x": 2254.8297227194325,
      "y": 727.6014087788083
    }
  ]
  t.true(deepEquals(mergeBezierCurvesToBezierSpline(getBezierSplineCurves(points3, false)), points3))

  const points4 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
    {
      "x": 2010.2384861779929,
      "y": 622.2445132979597
    },
    {
      "x": 2495.422445458091,
      "y": 486.217786562196
    },
    {
      "x": 2254.8297227194325,
      "y": 727.6014087788083
    },
    {
      "x": 2576.5793164486518,
      "y": 722.1480258342451
    }
  ]
  t.true(deepEquals(mergeBezierCurvesToBezierSpline(getBezierSplineCurves(points4, false)), points4))
})

test('mergeQuadraticCurvesToQuadraticSpline', (t) => {
  const points1 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
  ]
  t.true(deepEquals(mergeQuadraticCurvesToQuadraticSpline(getQuadraticSplineCurves(points1)), points1))

  const points2 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
    {
      "x": 2010.2384861779929,
      "y": 622.2445132979597
    },
  ]
  t.true(deepEquals(mergeQuadraticCurvesToQuadraticSpline(getQuadraticSplineCurves(points2)), points2))

  const points3 = [
    {
      "x": 1497.0004479637219,
      "y": -108.31053208812
    },
    {
      "x": 1899.2680995370695,
      "y": -219.2809187290435
    },
    {
      "x": 1723.5649873556072,
      "y": 363.3136111358049
    },
    {
      "x": 2190.5653644694935,
      "y": 118.25400730376546
    },
    {
      "x": 2010.2384861779929,
      "y": 622.2445132979597
    },
    {
      "x": 2495.422445458091,
      "y": 486.217786562196
    }
  ]
  t.true(deepEquals(mergeQuadraticCurvesToQuadraticSpline(getQuadraticSplineCurves(points3)), points3))
})
