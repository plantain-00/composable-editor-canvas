import React from "react"
import { ArrayEditor, BooleanEditor, Label, ObjectEditor, Button } from "../../src"
import { getModelResult } from "./utils"
import { Model, ModelStatus, Updater } from "./model"
import { items } from "./items"

export function Panel({ target, updater, status }: {
  target: Model
  updater: Updater
  status: React.MutableRefObject<ModelStatus | undefined>
}) {
  const [selectedItem, setSelectedItem] = React.useState(0)
  const r = getModelResult(target)
  const properties: Record<string, JSX.Element> = {
    speed: <Label>{r.speed}{'<-'}{r.baseSpeed}</Label>,
    canControl: <BooleanEditor value={target.canControl} setValue={v => updater(m => { m.canControl = v })} />,
  }
  if (r.health) {
    properties.health = <Label>{Math.round(r.health.current)}/{Math.round(r.health.total)}{'<-'}{Math.round(r.health.base.total)}</Label>
    properties.healthRegeneration = <Label>{r.health.regeneration}{'<-'}{r.health.base.regeneration}</Label>
    properties.armor = <Label>{Math.round(r.health.armor)}{'<-'}{r.health.base.armor}</Label>
    properties.magicResistance = <Label>{r.health.magicResistance}{'<-'}{r.health.base.magicResistance}</Label>
  }
  let mana: number | undefined
  if (r.mana) {
    mana = Math.round(r.mana.current)
    properties.mana = <Label>{mana}/{Math.round(r.mana.total)}{'<-'}{Math.round(r.mana.base.total)}</Label>
    properties.manaRegeneration = <Label>{r.mana.regeneration}{'<-'}{r.mana.regeneration}</Label>
  }
  if (r.attack) {
    properties.damage = <Label>{Math.round(r.attack.damage)}+-{r.attack.damageRange}{'<-'}{r.attack.base.damage}</Label>
    properties.attackSpeed = <Label>{r.attack.speed}{'<-'}{r.attack.base.speed}</Label>
    properties.attackTime = <Label>{Math.round(r.attack.time)}{'<-'}{r.attack.base.time}</Label>
    properties.bulletSpeed = <Label>{r.attack.bulletSpeed}</Label>
    properties.attackRange = <Label>{r.attack.range}{'<-'}{r.attack.base.range}</Label>
  }
  if (r.attributes) {
    properties.strength = <Label>{r.attributes.strength}{'<-'}{r.attributes.base.strength}</Label>
    properties.agility = <Label>{r.attributes.agility}{'<-'}{r.attributes.base.agility}</Label>
    properties.intelligence = <Label>{r.attributes.intelligence}{'<-'}{r.attributes.base.intelligence}</Label>
    properties.primary = <Label>{r.attributes.primary}</Label>
  }
  return (
    <div style={{ position: 'absolute', right: '0px', top: '0px', bottom: '0px', width: '400px', overflowY: 'auto', background: 'white', zIndex: 11 }}>
      <select value={selectedItem} onChange={f => setSelectedItem(+f.target.value)}>
        {items.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}
      </select>
      {target.items && <ArrayEditor
        inline
        add={() => updater(m => { if (m.items) { m.items.push(selectedItem) } })}
        remove={i => updater(m => { if (m.items) { m.items.splice(i, 1) } })}
        items={target.items.map(f => {
          const item = items[f]
          const cooldown = target.itemCooldowns?.find(c => c.itemIndex === f)?.cooldown
          if (!item.ability) {
            return <Label>{items[f].name}</Label>
          }
          const disabled = !!cooldown || mana === undefined || mana < item.ability.mana
          return <Button style={{ opacity: disabled ? 0.5 : 1 }} onClick={() => {
            if (!item.ability || disabled) return
            if (item.ability.cast) {
              status.current = {
                type: 'attack',
                itemIndex: f,
              }
              return
            }
            item.ability.launch(f, updater)
          }}>{items[f].name} {cooldown ? cooldown.toFixed(1) : ''}</Button>
        })}
      />}
      <ObjectEditor inline properties={properties} />
    </div>
  )
}
