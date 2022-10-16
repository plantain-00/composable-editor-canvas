import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export type RingContent = model.BaseContent<'ring'> & model.StrokeFields & model.FillFields & core.Position & {
  outerRadius: number
  innerRadius: number
}

export function getModel(ctx: PluginContext): model.Model<RingContent> {
  function getRingGeometriesFromCache(content: Omit<RingContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points1 = ctx.arcToPolyline({ ...content, r: content.outerRadius, startAngle: 0, endAngle: 360 }, ctx.angleDelta)
      const points2 = ctx.arcToPolyline({ ...content, r: content.innerRadius, startAngle: 0, endAngle: 360 }, ctx.angleDelta)
      const points = [...points1, ...points2]
      const lines1 = Array.from(ctx.iteratePolygonLines(points1))
      const lines2 = Array.from(ctx.iteratePolygonLines(points2))
      return {
        points,
        lines: [...lines1, ...lines1],
        bounding: ctx.getPointsBounding(points),
        regions: content.fillColor !== undefined ? [
          {
            lines: lines1,
            points: points1,
          },
          {
            lines: lines2,
            points: points2,
          },
        ] : undefined,
        renderingLines: [
          ...ctx.dashedPolylineToLines(ctx.polygonToPolyline(points1), content.dashArray),
          ...ctx.dashedPolylineToLines(ctx.polygonToPolyline(points2), content.dashArray),
        ],
      }
    })
  }
  const React = ctx.React
  return {
    type: 'ring',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      const { renderingLines, regions } = getRingGeometriesFromCache(content)
      if (regions) {
        return target.renderPath([regions[0].points, regions[1].points], { [colorField]: color, strokeWidth })
      }
      return target.renderGroup(renderingLines.map(r => target.renderPolyline(r, { [colorField]: color, strokeWidth })))
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRingContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getRingGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRingContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRingContent(c)) { c.y = v } })} />,
        outerRadius: <ctx.NumberEditor value={content.outerRadius} setValue={(v) => update(c => { if (isRingContent(c)) { c.outerRadius = v } })} />,
        innerRadius: <ctx.NumberEditor value={content.innerRadius} setValue={(v) => update(c => { if (isRingContent(c)) { c.innerRadius = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

export function isRingContent(content: model.BaseContent): content is RingContent {
  return content.type === 'ring'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="91.86884283091663,50 91.70951924339575,53.6491100949135 91.2327610295363,57.27044825861179 90.4421966072203,60.83645392104537 89.34384264905735,64.31998762591 87.94605829187336,67.69453757829653 86.25948151863179,70.93442141545832 84.29694819695987,74.01498166509921 82.07339439044554,76.9127734036263 79.60574268617492,79.60574268617492 76.9127734036263,82.07339439044554 74.01498166509921,84.29694819695987 70.93442141545833,86.25948151863179 67.69453757829653,87.94605829187336 64.31998762591002,89.34384264905735 60.83645392104537,90.4421966072203 57.2704482586118,91.2327610295363 53.6491100949135,91.70951924339575 50,91.86884283091663 46.3508899050865,91.70951924339575 42.72955174138821,91.2327610295363 39.16354607895463,90.4421966072203 35.68001237409,89.34384264905735 32.30546242170347,87.94605829187337 29.06557858454169,86.25948151863179 25.9850183349008,84.29694819695987 23.087226596373693,82.07339439044554 20.39425731382508,79.60574268617492 17.92660560955445,76.91277340362632 15.703051803040147,74.01498166509923 13.740518481368213,70.93442141545832 12.053941708126636,67.69453757829655 10.65615735094265,64.31998762591002 9.55780339277971,60.836453921045376 8.767238970463687,57.27044825861179 8.290480756604254,53.649110094913524 8.131157169083359,50.00000000000001 8.290480756604254,46.350889905086504 8.767238970463687,42.7295517413882 9.557803392779704,39.16354607895465 10.65615735094265,35.68001237409 12.05394170812663,32.30546242170347 13.74051848136822,29.065578584541676 15.703051803040125,25.9850183349008 17.926605609554443,23.087226596373696 20.394257313825072,20.39425731382508 23.08722659637369,17.92660560955445 25.985018334900776,15.703051803040147 29.06557858454166,13.740518481368227 32.30546242170344,12.053941708126644 35.68001237408997,10.656157350942657 39.16354607895464,9.55780339277971 42.72955174138821,8.767238970463687 46.3508899050865,8.290480756604254 49.99999999999999,8.131157169083359 53.64911009491349,8.290480756604254 57.27044825861178,8.76723897046368 60.83645392104538,9.55780339277971 64.31998762590999,10.656157350942642 67.69453757829655,12.053941708126636 70.93442141545833,13.74051848136822 74.01498166509921,15.703051803040132 76.9127734036263,17.926605609554443 79.60574268617492,20.394257313825072 82.07339439044554,23.087226596373682 84.29694819695985,25.985018334900772 86.25948151863177,29.06557858454166 87.94605829187336,32.30546242170344 89.34384264905735,35.68001237409 90.4421966072203,39.16354607895464 91.2327610295363,42.729551741388164 91.70951924339575,46.35088990508649 91.86884283091663,49.99999999999999" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="70.93442141545832,50 70.85475962169787,51.82455504745675 70.61638051476815,53.6352241293059 70.22109830361015,55.41822696052268 69.67192132452868,57.159993812955 68.97302914593668,58.847268789148266 68.1297407593159,60.46721070772916 67.14847409847994,62.00749083254961 66.03669719522277,63.45638670181315 64.80287134308746,64.80287134308746 63.45638670181315,66.03669719522277 62.00749083254961,67.14847409847994 60.467210707729166,68.1297407593159 58.847268789148266,68.97302914593668 57.15999381295501,69.67192132452868 55.41822696052268,70.22109830361015 53.6352241293059,70.61638051476815 51.82455504745675,70.85475962169787 50,70.93442141545832 48.175444952543245,70.85475962169787 46.3647758706941,70.61638051476815 44.58177303947731,70.22109830361015 42.840006187045,69.67192132452868 41.152731210851734,68.97302914593669 39.53278929227085,68.1297407593159 37.9925091674504,67.14847409847994 36.54361329818685,66.03669719522277 35.19712865691254,64.80287134308746 33.96330280477723,63.45638670181316 32.85152590152008,62.007490832549614 31.870259240684106,60.46721070772916 31.02697085406332,58.84726878914827 30.328078675471325,57.15999381295501 29.778901696389855,55.41822696052269 29.383619485231844,53.6352241293059 29.145240378302127,51.82455504745676 29.06557858454168,50 29.145240378302127,48.17544495254325 29.383619485231844,46.364775870694096 29.778901696389852,44.581773039477326 30.328078675471325,42.840006187045 31.026970854063315,41.152731210851734 31.87025924068411,39.532789292270834 32.85152590152006,37.9925091674504 33.96330280477722,36.54361329818685 35.19712865691254,35.19712865691254 36.54361329818684,33.96330280477723 37.992509167450386,32.85152590152008 39.532789292270834,31.870259240684113 41.15273121085172,31.026970854063322 42.840006187044985,30.32807867547133 44.58177303947732,29.778901696389855 46.3647758706941,29.383619485231844 48.175444952543245,29.145240378302127 49.99999999999999,29.06557858454168 51.82455504745675,29.145240378302127 53.63522412930589,29.38361948523184 55.41822696052269,29.778901696389855 57.159993812954994,30.32807867547132 58.84726878914827,31.02697085406332 60.467210707729166,31.87025924068411 62.00749083254961,32.85152590152006 63.45638670181315,33.96330280477722 64.80287134308746,35.19712865691254 66.03669719522277,36.54361329818684 67.14847409847992,37.992509167450386 68.1297407593159,39.532789292270834 68.97302914593668,41.15273121085172 69.67192132452868,42.840006187045 70.22109830361015,44.58177303947732 70.61638051476815,46.36477587069408 70.85475962169787,48.175444952543245 70.93442141545832,49.99999999999999" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create ring',
    icon,
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'create ring',
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1])
            contents.push({
              type: 'ring',
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
            } as RingContent)
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents: RingContent[] = []
      if (line) {
        const outerRadius = ctx.getTwoPointsDistance(line[0], line[1])
        assistentContents.push({
          type: 'ring',
          x: line[0].x,
          y: line[0].y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
      }
    },
    selectCount: 0,
  }
}
