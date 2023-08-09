import React from "react"
import { ArrayEditor, BooleanEditor, Label, EnumEditor, NumberEditor, ObjectEditor, Button } from "../../src"
import { getArmor, getAttackDamage, getAttackSpeed, getAttackTime, getHealthRegeneration, getMagicResistance, getManaRegeneration, getModelResult, getTotalHealth, getTotalMana } from "./utils"
import { Model, ModelStatus, Updater } from "./model"
import { items } from "./items"

export function Panel({ target, updater, status }: {
  target: Model
  updater: Updater
  status: React.MutableRefObject<ModelStatus | undefined>
}) {
  const [selectedItem, setSelectedItem] = React.useState(0)
  const modelResult = getModelResult(target)
  const properties: Record<string, JSX.Element> = {
    speed: <Label>{modelResult.speed}<NumberEditor value={target.speed} style={{ width: '60px' }} setValue={v => updater(m => { m.speed = v })} /></Label>,
    canControl: <BooleanEditor value={target.canControl} setValue={v => updater(m => { m.canControl = v })} />,
  }
  if (target.health && modelResult.health) {
    const totalHealth = getTotalHealth(modelResult.health.total, modelResult.abilities?.strength)
    properties.health = <Label>{Math.round(totalHealth * target.health.current)}/{Math.round(totalHealth)}<NumberEditor value={Math.round(target.health.total)} style={{ width: '60px' }} setValue={v => updater(m => { if (m.health) { m.health.total = v } })} /></Label>
    properties.healthRegeneration = <Label>{getHealthRegeneration(modelResult.health.regeneration, modelResult.abilities?.strength)}<NumberEditor value={target.health.regeneration} style={{ width: '60px' }} setValue={v => updater(m => { if (m.health) { m.health.regeneration = v } })} /></Label>
    properties.armor = <Label>{Math.round(getArmor(modelResult.health.armor, modelResult.abilities))}<NumberEditor value={target.health.armor} style={{ width: '60px' }} setValue={v => updater(m => { if (m.health) { m.health.armor = v } })} /></Label>
    properties.magicResistance = <Label>{getMagicResistance(target.health.magicResistance, modelResult.bonusMagicResistance, modelResult.abilities?.intelligence)}<NumberEditor value={target.health.magicResistance} style={{ width: '60px' }} setValue={v => updater(m => { if (m.health) { m.health.magicResistance = v } })} /></Label>
  }
  let mana: number | undefined
  if (target.mana && modelResult.mana) {
    const totalMana = getTotalMana(modelResult.mana.total, modelResult.abilities?.intelligence)
    mana = Math.round(totalMana * target.mana.current)
    properties.mana = <Label>{mana}/{Math.round(totalMana)}<NumberEditor value={Math.round(target.mana.total)} style={{ width: '60px' }} setValue={v => updater(m => { if (m.mana) { m.mana.total = v } })} /></Label>
    properties.manaRegeneration = <Label>{getManaRegeneration(modelResult.mana.regeneration, modelResult.abilities?.intelligence)}<NumberEditor value={target.mana.regeneration} style={{ width: '60px' }} setValue={v => updater(m => { if (m.mana) { m.mana.regeneration = v } })} /></Label>
  }
  if (target.attack && modelResult.attack) {
    properties.damage = <Label>{Math.round(getAttackDamage(modelResult.attack.damage, modelResult.abilities))}+-{target.attack.damageRange}<NumberEditor value={target.attack.damage} style={{ width: '60px' }} setValue={v => updater(m => { if (m.attack) { m.attack.damage = v } })} /></Label>
    properties.attackSpeed = <Label>{getAttackSpeed(modelResult.attack.speed, modelResult.abilities?.agility)}<NumberEditor value={target.attack.speed} style={{ width: '60px' }} setValue={v => updater(m => { if (m.attack) { m.attack.speed = v } })} /></Label>
    properties.attackTime = <Label>{Math.round(getAttackTime(target.attack.time, modelResult.attack.speed, modelResult.abilities?.agility))}<NumberEditor value={target.attack.time} style={{ width: '60px' }} setValue={v => updater(m => { if (m.attack) { m.attack.time = v } })} /></Label>
    properties.bulletSpeed = <NumberEditor value={target.attack.bulletSpeed} style={{ width: '60px' }} setValue={v => updater(m => { if (m.attack) { m.attack.bulletSpeed = v } })} />
    properties.attackRange = <Label>{modelResult.attack.range}<NumberEditor value={target.attack.range} style={{ width: '60px' }} setValue={v => updater(m => { if (m.attack) { m.attack.range = v } })} /></Label>
  }
  if (target.abilities && modelResult.abilities) {
    properties.strength = <Label>{modelResult.abilities.strength}<NumberEditor value={target.abilities.strength} style={{ width: '60px' }} setValue={v => updater(m => { if (m.abilities) { m.abilities.strength = v } })} /></Label>
    properties.agility = <Label>{modelResult.abilities.agility}<NumberEditor value={target.abilities.agility} style={{ width: '60px' }} setValue={v => updater(m => { if (m.abilities) { m.abilities.agility = v } })} /></Label>
    properties.intelligence = <Label>{modelResult.abilities.intelligence}<NumberEditor value={target.abilities.intelligence} style={{ width: '60px' }} setValue={v => updater(m => { if (m.abilities) { m.abilities.intelligence = v } })} /></Label>
    properties.primary = <EnumEditor enums={['strength', 'agility', 'intelligence', 'universal']} value={target.abilities.primary} setValue={v => updater(m => { if (m.abilities) { m.abilities.primary = v } })} />
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
