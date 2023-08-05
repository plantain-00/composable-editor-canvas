import React from "react"
import { ArrayEditor, BooleanEditor, Button, EnumEditor, NumberEditor, ObjectEditor } from "../../src"
import { getArmor, getAttackDamage, getAttackSpeed, getAttackTime, getHealthRegeneration, getMagicResistance, getManaRegeneration, getModelResult, getTotalHealth, getTotalMana } from "./utils"
import { Model } from "./model"
import { items } from "./items"

export function Panel({ target, updater }: { target: Model, updater: (update: (content: Model) => void) => void }) {
  const [selectedItem, setSelectedItem] = React.useState(0)
  const modelResult = getModelResult(target)
  const properties: Record<string, JSX.Element> = {
    baseSpeed: <NumberEditor value={target.speed} setValue={v => updater(m => { m.speed = v })} />,
    totalSpeed: <NumberEditor value={modelResult.speed} />,
    canControl: <BooleanEditor value={target.canControl} setValue={v => updater(m => { m.canControl = v })} />,
  }
  if (target.health && modelResult.health) {
    const totalHealth = getTotalHealth(modelResult.health.total, modelResult.abilities?.strength)
    properties.baseHealth = <NumberEditor value={Math.round(target.health.total)} setValue={v => updater(m => { if (m.health) { m.health.total = v } })} />
    properties.totalHealth = <NumberEditor value={Math.round(totalHealth)} />
    properties.currentHealth = <NumberEditor value={Math.round(totalHealth * target.health.current)} />
    properties.baseHealthRegeneration = <NumberEditor value={target.health.regeneration} setValue={v => updater(m => { if (m.health) { m.health.regeneration = v } })} />
    properties.totalHealthRegeneration = <NumberEditor value={getHealthRegeneration(modelResult.health.regeneration, modelResult.abilities?.strength)} />
    properties.baseArmor = <NumberEditor value={target.health.armor} setValue={v => updater(m => { if (m.health) { m.health.armor = v } })} />
    properties.totalArmor = <NumberEditor value={Math.round(getArmor(modelResult.health.armor, modelResult.abilities))} />
    properties.baseMagicResistance = <NumberEditor value={target.health.magicResistance} setValue={v => updater(m => { if (m.health) { m.health.magicResistance = v } })} />
    properties.totalMagicResistance = <NumberEditor value={getMagicResistance(target.health.magicResistance, modelResult.bonusMagicResistance, modelResult.abilities?.intelligence)} />
  }
  if (target.mana && modelResult.mana) {
    const totalMana = getTotalMana(modelResult.mana.total, modelResult.abilities?.intelligence)
    properties.baseMana = <NumberEditor value={Math.round(target.mana.total)} setValue={v => updater(m => { if (m.mana) { m.mana.total = v } })} />
    properties.totalMana = <NumberEditor value={Math.round(totalMana)} />
    properties.currentMana = <NumberEditor value={Math.round(totalMana * target.mana.current)} />
    properties.baseManaRegeneration = <NumberEditor value={target.mana.regeneration} setValue={v => updater(m => { if (m.mana) { m.mana.regeneration = v } })} />
    properties.totalManaRegeneration = <NumberEditor value={getManaRegeneration(modelResult.mana.regeneration, modelResult.abilities?.intelligence)} />
  }
  if (target.attack && modelResult.attack) {
    properties.baseDamage = <NumberEditor value={target.attack.damage} setValue={v => updater(m => { if (m.attack) { m.attack.damage = v } })} />
    properties.damageRange = <NumberEditor value={target.attack.damageRange} setValue={v => updater(m => { if (m.attack) { m.attack.damageRange = v } })} />
    properties.totalDamage = <NumberEditor value={Math.round(getAttackDamage(modelResult.attack.damage, modelResult.abilities))} />
    properties.baseAttackSpeed = <NumberEditor value={target.attack.speed} setValue={v => updater(m => { if (m.attack) { m.attack.speed = v } })} />
    properties.totalAttackSpeed = <NumberEditor value={getAttackSpeed(modelResult.attack.speed, modelResult.abilities?.agility)} />
    properties.baseAttackTime = <NumberEditor value={target.attack.time} setValue={v => updater(m => { if (m.attack) { m.attack.time = v } })} />
    properties.totalAttackTime = <NumberEditor value={Math.round(getAttackTime(target.attack.time, modelResult.attack.speed, modelResult.abilities?.agility))} />
    properties.bulletSpeed = <NumberEditor value={target.attack.bulletSpeed} setValue={v => updater(m => { if (m.attack) { m.attack.bulletSpeed = v } })} />
    properties.baseAttackRange = <NumberEditor value={target.attack.range} setValue={v => updater(m => { if (m.attack) { m.attack.range = v } })} />
    properties.totalAttackRange = <NumberEditor value={modelResult.attack.range} />
  }
  if (target.abilities && modelResult.abilities) {
    properties.baseStrength = <NumberEditor value={target.abilities.strength} setValue={v => updater(m => { if (m.abilities) { m.abilities.strength = v } })} />
    properties.totalStrength = <NumberEditor value={modelResult.abilities.strength} />
    properties.baseAgility = <NumberEditor value={target.abilities.agility} setValue={v => updater(m => { if (m.abilities) { m.abilities.agility = v } })} />
    properties.totalAgility = <NumberEditor value={modelResult.abilities.agility} />
    properties.baseIntelligence = <NumberEditor value={target.abilities.intelligence} setValue={v => updater(m => { if (m.abilities) { m.abilities.intelligence = v } })} />
    properties.totalIntelligence = <NumberEditor value={modelResult.abilities.intelligence} />
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
        items={target.items.map(f => <Button>{items[f].name}</Button>)}
      />}
      <ObjectEditor inline properties={properties} />
    </div>
  )
}
